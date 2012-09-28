var connect = require('connect');
var ejs = require('ejs');
var fs = require('fs');
var socketio = require('socket.io');

var basicPosition = [
            ['BR', 'BN', 'BB', 'BQ', 'BK', 'BB', 'BN', 'BR'],
            ['BP', 'BP', 'BP', 'BP', 'BP', 'BP', 'BP', 'BP'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['WP', 'WP', 'WP', 'WP', 'WP', 'WP', 'WP', 'WP'],
            ['WR', 'WN', 'WB', 'WQ', 'WK', 'WB', 'WN', 'WR']
];

var server = connect.createServer();

// Router 미들웨어를 사용합니다.
server.use(connect.router(function (app) {
  app.get('/', function (request, response) {
    fs.readFile('Lobby.html', function (error, data) {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(data);
    });
  });

  app.get('/Error', function (request, response) {
    fs.readFile('Error.html', function (error, data) {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(data);
    });
  });

  app.get('/chess/:room', function (request, response) {
    fs.readFile('OurChess.html', 'utf8', function (error, data) {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(ejs.render(data, {
        room: request.params.room
      }));
    });
  });
}));

// Static 미들웨어를 사용합니다.
server.use(connect.static(__dirname + '/Resource'));

server.listen(process.env.port || 1337);

// 소켓 서버를 생성 및 실행합니다.
var io = socketio.listen(server);

io.set("polling duration", 10);
io.set('log level', 2);

io.sockets.on('connection', function (socket) {
  socket.on('join', function (data) {
    socket.join(data);
    socket.set('room', data);

    if (io.sockets.clients(data).length == 1) {
      socket.set('whiteId', socket.id);
      socket.emit('id', { yourColor: 'W', opponentColor: 'B', yourId: socket.id.substring(0, 3), length: io.sockets.clients(data).length });
      socket.emit('setPosition', basicPosition);
    } else if (io.sockets.clients(data).length == 2) {
      socket.set('blackId', socket.id);
      socket.emit('id', { yourColor: 'B', opponentColor: 'W', yourId: socket.id.substring(0, 3), length: io.sockets.clients(data).length });
      socket.emit('setPosition', basicPosition);
      io.sockets.socket(io.sockets.clients(data)[0].id).emit('setPosition', basicPosition); // 새 게임
      socket.broadcast.to(data).emit('gameStart', true);
    } else if (io.sockets.clients(data).length >= 3) {
      socket.emit('id', { yourColor: 'Guest', yourId: socket.id.substring(0, 3), length: io.sockets.clients(data).length });
      io.sockets.socket(io.sockets.clients(data)[0].id).emit('getPosition', { id: socket.id });
    }

  });

  socket.on('broadcastPosition', function (data) {
    socket.get('room', function (error, room) {
      io.sockets.socket(data.id).emit('setPosition', data.position);
    });
  });

  socket.on('dragStart', function (data) {
    socket.get('room', function (error, room) {
      socket.broadcast.to(room).emit('dragStart_opponent', data);
      socket.broadcast.to(room).emit('dragStart_guest', data);
    });
  });

  socket.on('drag', function (data) {
    socket.get('room', function (error, room) {
      socket.broadcast.to(room).emit('drag_opponent', data);
      socket.broadcast.to(room).emit('drag_guest', data);
    });
  });

  socket.on('dragEnd', function (data) {
    socket.get('room', function (error, room) {
      socket.broadcast.to(room).emit('dragEnd_opponent', data);
      socket.broadcast.to(room).emit('dragEnd_guest', data);
    });
  });

  socket.on('endOfTurn', function (data) {
    socket.get('room', function (error, room) {
      if (data == 'W') { socket.broadcast.to(room).emit('turnOff', 'B'); }
      else if (data == 'B') { socket.broadcast.to(room).emit('turnOff', 'W'); }
    });
  });

  socket.on('castle', function (data) {
    socket.get('room', function (error, room) {
      socket.broadcast.to(room).emit('castle_opponent', data);
      socket.broadcast.to(room).emit('castle_guest', data);
    });
  });

  socket.on('enPassant', function (data) {
    socket.get('room', function (error, room) {
      socket.broadcast.to(room).emit('enPassant_opponent', data);
      socket.broadcast.to(room).emit('enPassant_guest', data);
    });
  });

  socket.on('check', function (data) {
    socket.get('room', function (error, room) {
      io.sockets.in(room).emit('check', data);
    });
  });

  socket.on('gameEnd', function (data) {
    socket.get('room', function (error, room) {
      io.sockets.in(room).emit('gameEnd', data);
    });
  });

  socket.on('sendMessage', function (data) {
    socket.get('room', function (error, room) {
      io.sockets.in(room).emit('chatMessage', data);
    });
  });

  socket.on('playSound', function (data) {
    socket.get('room', function (error, room) {
      io.sockets.in(room).emit('playSoundGuys', data);
    });
  });

  socket.on('disconnect', function () {
    socket.get('room', function (error, room) {
      socket.get('whiteId', function (error, whiteId) {
        socket.get('blackId', function (error, blackId) {
          if (socket.id == whiteId) {
            for (var i = 0, max = io.sockets.clients(room).length; i < max; i++) {
              io.sockets.socket(io.sockets.clients(room)[i].id).emit('roomBrokenByWhite');
            }
          } else if (socket.id == blackId) {
            socket.broadcast.to(room).emit('chatMessage', { name: 'Server', message: 'Black 퇴장. [인원 ' + (io.sockets.clients(room).length - 1) + '명]' });
            socket.broadcast.to(room).emit('gameEnd', 'Black이 퇴장했습니다.');
          } else {
            socket.broadcast.to(room).emit('chatMessage', { name: 'Server', message: 'Guest[' + socket.id.substring(0, 3) + '] 퇴장. [인원 ' + (io.sockets.clients(room).length - 1) + '명]' });
          }
        });
      });
    });
  });
});