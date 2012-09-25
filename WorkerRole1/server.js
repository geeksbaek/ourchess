var connect = require('connect');
var ejs = require('ejs');
var fs = require('fs');
var socketio = require('socket.io');

var roomArray = [];
var piecePosition = [
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

io.configure(function () {
    //io.set('transports', ['xhr-polling', 'jsonp-polling', 'htmlfile']);
    io.set("polling duration", 10);
});
io.set('log level', 2);

io.sockets.on('connection', function (socket) {
    socket.on('join', function (data) {
        socket.join(data);
        socket.set('room', data);

        try {
            roomArray[data].count++;

            if (roomArray[data].count == 1) {
                socket.emit('id', { yourColor: 'W', opponentColor: 'B', position: roomArray[data].position });
                console.log('[' + data + '] ' + 'White Player Joining. Waiting for opponent..');
            } else if (roomArray[data].count == 2) {
                socket.emit('id', { yourColor: 'B', opponentColor: 'W', position: roomArray[data].position });
                socket.get('room', function (error, room) {
                    socket.broadcast.to(room).emit('gameStart', true);
                });
                console.log('[' + data + '] ' + 'Black Player Joining. Game Start!');
            } else {
                socket.emit('id', { yourColor: 'Guest', position: roomArray[data].position });
                roomArray[data].guest++;
                console.log('[' + data + '] ' + 'Guest Player Joining.');
            }
        } catch (e) {
            socket.disconnect();
            console.log(data + ' ' + e);
        }
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

    socket.on('addroom', function (data) {
        roomArray[data] = roomArray[data] ? roomArray[data] : { count: 0, position: piecePosition };
    });

    socket.on('positionUpdate', function (data) {
        roomArray[data.room].position = data.position;
    });

    socket.on('endOfTurn', function (data) {
        socket.get('room', function (error, room) {
            if (data == 'W') {
                socket.broadcast.to(room).emit('turnOff', 'B');
            } else if (data == 'B') {
                socket.broadcast.to(room).emit('turnOff', 'W');
            }
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
            socket.broadcast.to(room).emit('check', data);
        });
    });

    socket.on('gameEnd', function (data) {
        socket.get('room', function (error, room) {
            socket.broadcast.to(room).emit('gameEnd', data);
        });
    });

    socket.on('disconnect', function () {
        console.log('disconnect');
    });
});