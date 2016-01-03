var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var ejs = require('ejs');
var fs = require('fs');

var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 80;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

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

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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

io.set("polling duration", 10);
io.set('log level', 2);

var defaultNsps = '/';

io.on('connection', function (socket) {
  socket.on('join', function (data){
    socket.room = data;
    socket.join(socket.room);    
    if (Object.keys(io.nsps[defaultNsps].adapter.rooms[data]).length === 1) {
      socket.whiteId = socket.id;
      socket.emit('id', { yourColor: 'W', opponentColor: 'B', yourId: socket.id.substring(0, 3), length: Object.keys(io.nsps[defaultNsps].adapter.rooms[data]).length });
      socket.emit('setPosition', basicPosition);
    } else if (Object.keys(io.nsps[defaultNsps].adapter.rooms[data]).length === 2) {
      socket.blackId = socket.id;
      socket.emit('id', { yourColor: 'B', opponentColor: 'W', yourId: socket.id.substring(0, 3), length: Object.keys(io.nsps[defaultNsps].adapter.rooms[data]).length });
      socket.emit('setPosition', basicPosition);
      io.sockets.connected[Object.keys(io.nsps[defaultNsps].adapter.rooms[data])[0]].emit('setPosition', basicPosition); // 새 게임
      io.sockets.in(data).emit('gameStart', true);
    } else if (Object.keys(io.nsps[defaultNsps].adapter.rooms[data]).length >= 3) {
      socket.emit('id', { yourColor: 'Guest', yourId: socket.id.substring(0, 3), length: Object.keys(io.nsps[defaultNsps].adapter.rooms[data]).length });
      io.sockets.connected[Object.keys(io.nsps[defaultNsps].adapter.rooms[data])[0]].emit('getPosition', { id: socket.id });
    }
  });
  
  socket.on('disconnect', function () {
    if (socket.room != null && io.nsps[defaultNsps].adapter.rooms[socket.room]) {
      if (socket.id == socket.whiteId) {
        for (var i = 0, max = Object.keys(io.nsps[defaultNsps].adapter.rooms[socket.room]).length; i < max; i++) {
          io.sockets.connected[io.nsps[defaultNsps].adapter.rooms[socket.room][i].id].emit('roomBrokenByWhite');
        }
      } else if (socket.id == socket.blackId) {
        socket.broadcast.to(socket.room).emit('chatMessage', { name: 'Server', message: 'Black disconnected. [' + (Object.keys(io.nsps[defaultNsps].adapter.rooms[socket.room]).length - 1) + ' in a room]' });
        socket.broadcast.to(socket.room).emit('gameEnd', { reason: 'Black disconnected', message: 'White Wins!', winner: 'W' });
      } else {
        socket.broadcast.to(socket.room).emit('chatMessage', { name: 'Server', message: 'Guest[' + socket.id.substring(0, 3) + '] disconnected. [' + (Object.keys(io.nsps[defaultNsps].adapter.rooms[socket.room]).length - 1) + ' in a room]' });
      }
    }
  });
  
  socket.on('broadcastPosition', function (data) {
    console.log('broadcastPosition');
    io.sockets.connected[data.id].emit('setPosition', data.position);
  });

  socket.on('dragStart', function (data) {
    console.log('dragStart');
    socket.broadcast.to(socket.room).emit('dragStart_opponent', data);
    socket.broadcast.to(socket.room).emit('dragStart_guest', data);
  });

  socket.on('drag', function (data) {
    console.log('drag');
    socket.broadcast.to(socket.room).emit('drag_opponent', data);
    socket.broadcast.to(socket.room).emit('drag_guest', data);
  });

  socket.on('dragEnd', function (data) {
    console.log('dragEnd');
    socket.broadcast.to(socket.room).emit('dragEnd_opponent', data);
    socket.broadcast.to(socket.room).emit('dragEnd_guest', data);
  });

  socket.on('endOfTurn', function (data) {
    console.log('endOfTurn');
    if (data == 'W') { socket.broadcast.to(socket.room).emit('turnOff', 'B'); }
    else if (data == 'B') { socket.broadcast.to(socket.room).emit('turnOff', 'W'); }
  });

  socket.on('castle', function (data) {
    console.log('castle');
    socket.broadcast.to(socket.room).emit('castle_opponent', data);
    socket.broadcast.to(socket.room).emit('castle_guest', data);
  });

  socket.on('enPassant', function (data) {
    console.log('enPassant');
    socket.broadcast.to(socket.room).emit('enPassant_opponent', data);
    socket.broadcast.to(socket.room).emit('enPassant_guest', data);
  });

  socket.on('check', function () {
    console.log('check');
    io.sockets.in(socket.room).emit('check');
  });

  socket.on('gameEnd', function (data) {
    console.log('gameEnd');
    io.sockets.in(socket.room).emit('gameEnd', data);
  });

  socket.on('sendMessage', function (data) {
    console.log('sendMessage');
    io.sockets.in(socket.room).emit('chatMessage', data);
  });

  socket.on('playSound', function (data) {
    console.log('playSound');
    io.sockets.in(socket.room).emit('playSoundGuys', data);
  });
});

module.exports = app;
