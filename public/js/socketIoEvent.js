function basicEvent() {
  socket.emit('join', OURCHESS.room);

  socket.on('id', function (data) {
    OURCHESS.myColor = data.yourColor;
    OURCHESS.myId = data.yourId;

    if (OURCHESS.myColor == 'Guest') {
      guestEvent();
      setTimeout(function () {
        popup('You are observer.', 'information');
      }, 800);
      socket.emit('sendMessage', { name: 'Server', message: 'Guest[' + OURCHESS.myId + '] connected. [' + data.length + ' in a room]' });
    } else {
      OURCHESS.enemyColor = data.opponentColor;
      opponentEvent();
      dnd();

      if (OURCHESS.myColor == 'W') {
        whiteEvent();
        setTimeout(function () {
          popup('Copy the URL, and Send it to your friends to invite them to this match.', 'information', true);
        }, 800);
        socket.emit('sendMessage', { name: 'Server', message: 'White connected. [' + data.length + ' in a room]' });
        socket.emit('sendMessage', { name: 'Server', message: 'Waiting for your opponent..' });
      } else {
        setTimeout(function () {
          popup('Game Start.', 'information');
        }, 800);
        socket.emit('sendMessage', { name: 'Server', message: 'Black connected. [' + data.length + ' in a room]' });
      }
    }
  });

  socket.on('setPosition', function (data) {
    OURCHESS.piecePosition = OURCHESS.myColor == 'B' ? rotateBoard(data) : data;
    OURCHESS.oldPiecePosition = $.extend(true, [], OURCHESS.piecePosition);

    setTimeout(function () {
      OURCHESS.chessBoardDiv.fadeIn(200);
      setRayout();
      draw();
    }, 500);
  });

  socket.on('gameStart', function (data) {
    if (OURCHESS.myColor == 'W') {
      OURCHESS.movePermission = true;
      OURCHESS.recordingPosition = [];
      OURCHESS.recordingPosition.push({ position: OURCHESS.piecePosition.toString(), repetition: 1 });
      popup('Black player connected. Game Start.', 'information');
    }

    OURCHESS.gameOn = true;
    OURCHESS.check = false;
    OURCHESS.castle = true;
    OURCHESS.queenSideCastle = true;
    OURCHESS.kingSideCastle = true;

    OURCHESS.threefoldRepetition = false;

    OURCHESS.oldPiecePosition = $.extend(true, [], OURCHESS.piecePosition);
  });

  socket.on('check', function () {
    popup('Check!', 'warning');
  });

  socket.on('gameEnd', function (data) {
    var winner = OURCHESS.myColor == 'Guest' || data.winner == 'draw' ? 'information' : OURCHESS.myColor == data.winner ? 'success' : 'fail';

    if (OURCHESS.gameOn == true) {
      popup(data.reason + '. ' + data.message, winner);
    } else {
      popup(data.reason + '. ', 'warning');
    }

    OURCHESS.movePermission = false;
    OURCHESS.gameOn = false;

    OURCHESS.record.text(OURCHESS.record.text() + 'Server : ' + data.reason + '. ' + data.message + '\n');
    OURCHESS.record.scrollTop(OURCHESS.record[0].scrollHeight);
  });

  socket.on('chatMessage', function (data) {
    OURCHESS.record.text(OURCHESS.record.text() + data.name + ' : ' + data.message + '\n');
    OURCHESS.record.scrollTop(OURCHESS.record[0].scrollHeight);
  });

  socket.on('playSoundGuys', function (data) {
    OURCHESS.audioElement.setAttribute('src', '/sound/' + data + 'Sound' + (Math.floor(Math.random() * 4) + 1) + '.mp3');
    OURCHESS.audioElement.play();
  });

  socket.on('error', function (data) {
    location = '/Error';
  });

  socket.on('roomBrokenByWhite', function () {
    location = '/Error';
  });
}

function whiteEvent() {
  socket.on('getPosition', function (data) {
    socket.emit('broadcastPosition', { id: data.id, position: OURCHESS.piecePosition });
  });
}

function opponentEvent() {
  socket.on('turnOff', function (data) {
    if (data == OURCHESS.myColor) { OURCHESS.movePermission = true; }
  });

  socket.on('castle_opponent', function (data) {
    drawSquare(OURCHESS.context, Math.abs(7 - data.oldRook.x), Math.abs(7 - data.oldRook.y));
    drawPieceX(OURCHESS.context, data.myColor + 'R', Math.abs(7 - data.newRook.x), Math.abs(7 - data.newRook.y));
    setPosition(OURCHESS.piecePosition, { x: Math.abs(7 - data.oldRook.x), y: Math.abs(7 - data.oldRook.y) }, { x: Math.abs(7 - data.newRook.x), y: Math.abs(7 - data.newRook.y) }, data.myColor + 'R');
  });

  socket.on('enPassant_opponent', function (data) {
    OURCHESS.piecePosition[Math.abs(7 - data.y)][Math.abs(7 - data.x)] = '';
    drawSquare(OURCHESS.context, Math.abs(7 - data.x), Math.abs(7 - data.y));
  });

  socket.on('dragStart_opponent', function (data) {
    drawSquare(OURCHESS.context, Math.abs(7 - data.drawSquare.x), Math.abs(7 - data.drawSquare.y));
    drawPieceX(OURCHESS.dragContext, data.piece, 0, 0);
    $(OURCHESS.theDragCanvas).css('visibility', 'visible');
  });

  socket.on('drag_opponent', function (data) {
    $(OURCHESS.theDragCanvas).css('top',
        0 -
        (data.top * (OURCHESS.PIECE_SIZE / data.PIECE_SIZE)) -
        (OURCHESS.PIECE_SIZE / 2) +
        (OURCHESS.PIECE_SIZE * 8) +
        ($(OURCHESS.theCanvas).outerWidth() - $(OURCHESS.theCanvas).width()) +
        Number(OURCHESS.chessBoardDiv.css('paddingLeft').replace('px', ''))
      );
    $(OURCHESS.theDragCanvas).css('left',
        0 -
        (data.left * (OURCHESS.PIECE_SIZE / data.PIECE_SIZE)) -
        (OURCHESS.PIECE_SIZE / 2) +
        (OURCHESS.PIECE_SIZE * 8) +
        ($(OURCHESS.theCanvas).outerWidth() - $(OURCHESS.theCanvas).width()) +
        Number(OURCHESS.chessBoardDiv.css('paddingLeft').replace('px', ''))
      );
  });

  socket.on('dragEnd_opponent', function (data) {
    if (data.possible == false) {
      drawPieceX(OURCHESS.context, data.piece, Math.abs(7 - data.point.x), Math.abs(7 - data.point.y));
    } else {
      OURCHESS.oldPiecePosition = $.extend(true, [], OURCHESS.piecePosition);

      setPosition(OURCHESS.piecePosition, { x: Math.abs(7 - data.start.x), y: Math.abs(7 - data.start.y) }, { x: Math.abs(7 - data.end.x), y: Math.abs(7 - data.end.y) }, data.piece);
      drawSquare(OURCHESS.context, Math.abs(7 - data.end.x), Math.abs(7 - data.end.y)); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
      drawPieceX(OURCHESS.context, data.piece, Math.abs(7 - data.end.x), Math.abs(7 - data.end.y));

      if (OURCHESS.myColor == 'W') {
        var positionString = OURCHESS.piecePosition.toString();

        for (var i = 0, max = OURCHESS.recordingPosition.length; i < max; i++) {
          if (OURCHESS.recordingPosition[i].position == positionString) {
            OURCHESS.recordingPosition[i].repetition++;
            break;
          }

          if (i == max - 1) {
            OURCHESS.recordingPosition.push({ position: positionString, repetition: 1 });
          }
        }
      }
    }

    $(OURCHESS.theDragCanvas).css('visibility', 'hidden');
    cleartheDragCanvas();

    var _isCheck = isDengerousOrSafe(OURCHESS.piecePosition, findMyKing(OURCHESS.piecePosition));
    if (_isCheck.bool) {
      if (isCheckmate(OURCHESS.piecePosition, findMyKing(OURCHESS.piecePosition), _isCheck.attacker).bool) {
        OURCHESS.movePermission = false;
        socket.emit('gameEnd', { reason: 'Checkmate', message: OURCHESS.myColor == 'W' ? 'Black Wins!' : 'White Wins!', winner: OURCHESS.enemyColor });
      } else {
        OURCHESS.check = true;
        socket.emit('check');
        socket.emit('sendMessage', { name: 'Server', message: 'Check!' });
      }
    } else {
      var _isDraw = isDraw(OURCHESS.piecePosition);
      if (_isDraw.bool) {
        OURCHESS.movePermission = false;
        socket.emit('gameEnd', { reason: _isDraw.reason, message: 'Draw', winner: 'draw' });
      } else {
        OURCHESS.check = false;
      }
    }
  });
}

function guestEvent() {
  socket.on('castle_guest', function (data) {
    if (data.myColor == 'W') {
      drawSquare(OURCHESS.context, data.oldRook.x, data.oldRook.y);
      drawPieceX(OURCHESS.context, data.myColor + 'R', data.newRook.x, data.newRook.y);
      setPosition(OURCHESS.piecePosition, oldRook, newRook, data.myColor + 'R');
    } else {
      drawSquare(OURCHESS.context, Math.abs(7 - data.oldRook.x), Math.abs(7 - data.oldRook.y));
      drawPieceX(OURCHESS.context, data.drawPieceX_piece, Math.abs(7 - data.newRook.x), Math.abs(7 - data.newRook.y));
      setPosition(OURCHESS.piecePosition, { x: Math.abs(7 - data.oldRook.x), y: Math.abs(7 - data.oldRook.y) }, { x: Math.abs(7 - data.newRook.x), y: Math.abs(7 - data.newRook.y) }, data.myColor + 'R');
    }
  });

  socket.on('enPassant_guest', function (data) {
    if (data.myColor == 'W') {
      OURCHESS.piecePosition[data.y][data.x] = '';
      drawSquare(OURCHESS.context, data.x, data.y);
    } else {
      OURCHESS.piecePosition[Math.abs(7 - data.y)][Math.abs(7 - data.x)] = '';
      drawSquare(OURCHESS.context, Math.abs(7 - data.x), Math.abs(7 - data.y));
    }
  });

  socket.on('dragStart_guest', function (data) {
    if (data.myColor == 'W') { // 백의 이동에 대한 게스트 보드의 움직임
      drawSquare(OURCHESS.context, data.drawSquare.x, data.drawSquare.y);
      drawPieceX(OURCHESS.dragContext, data.piece, 0, 0);
      $(OURCHESS.theDragCanvas).css('visibility', 'visible');
    } else if (data.myColor == 'B') { // 흑의 이동에 대한 게스트 보드의 움직임
      drawSquare(OURCHESS.context, Math.abs(7 - data.drawSquare.x), Math.abs(7 - data.drawSquare.y));
      drawPieceX(OURCHESS.dragContext, data.piece, 0, 0);
      $(OURCHESS.theDragCanvas).css('visibility', 'visible');
    }
  });

  socket.on('drag_guest', function (data) {
    if (data.myColor == 'W') { // 백의 이동에 대한 게스트 보드의 움직임
      $(OURCHESS.theDragCanvas).css('top',
          (data.top * (OURCHESS.PIECE_SIZE / data.PIECE_SIZE)) -
          (OURCHESS.PIECE_SIZE / 2) +
          Number(OURCHESS.chessBoardDiv.css('paddingLeft').replace('px', ''))
        );
      $(OURCHESS.theDragCanvas).css('left',
          (data.left * (OURCHESS.PIECE_SIZE / data.PIECE_SIZE)) -
          (OURCHESS.PIECE_SIZE / 2) +
          Number(OURCHESS.chessBoardDiv.css('paddingLeft').replace('px', ''))
        );
    } else if (data.myColor == 'B') { // 흑의 이동에 대한 게스트 보드의 움직임
      $(OURCHESS.theDragCanvas).css('top',
          0 -
          (data.top * (OURCHESS.PIECE_SIZE / data.PIECE_SIZE)) -
          (OURCHESS.PIECE_SIZE / 2) +
          (OURCHESS.PIECE_SIZE * 8) +
          ($(OURCHESS.theCanvas).outerWidth() - $(OURCHESS.theCanvas).width()) +
          Number(OURCHESS.chessBoardDiv.css('paddingLeft').replace('px', ''))
        );
      $(OURCHESS.theDragCanvas).css('left',
          0 -
          (data.left * (OURCHESS.PIECE_SIZE / data.PIECE_SIZE)) -
          (OURCHESS.PIECE_SIZE / 2) +
          (OURCHESS.PIECE_SIZE * 8) +
          ($(OURCHESS.theCanvas).outerWidth() - $(OURCHESS.theCanvas).width()) +
          Number(OURCHESS.chessBoardDiv.css('paddingLeft').replace('px', ''))
        );
    }
  });

  socket.on('dragEnd_guest', function (data) {
    if (data.myColor == 'W') { // 백의 이동에 대한 게스트 보드의 움직임
      if (data.possible == false) {
        drawPieceX(OURCHESS.context, data.piece, data.point.x, data.point.y);
      } else {
        setPosition(OURCHESS.piecePosition, data.start, data.end, data.piece);
        drawSquare(OURCHESS.context, data.end.x, data.end.y); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
        drawPieceX(OURCHESS.context, data.piece, data.end.x, data.end.y);
      }
    } else if (data.myColor == 'B') { // 흑의 이동에 대한 게스트 보드의 움직임
      if (data.possible == false) {
        drawPieceX(OURCHESS.context, data.piece, Math.abs(7 - data.point.x), Math.abs(7 - data.point.y));
      } else {
        setPosition(OURCHESS.piecePosition, { x: Math.abs(7 - data.start.x), y: Math.abs(7 - data.start.y) }, { x: Math.abs(7 - data.end.x), y: Math.abs(7 - data.end.y) }, data.piece);
        drawSquare(OURCHESS.context, Math.abs(7 - data.end.x), Math.abs(7 - data.end.y)); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
        drawPieceX(OURCHESS.context, data.piece, Math.abs(7 - data.end.x), Math.abs(7 - data.end.y));
      }
    }

    $(OURCHESS.theDragCanvas).css('visibility', 'hidden');
    cleartheDragCanvas();

    $(OURCHESS.theDragCanvas).css('marginLeft', '0px');
    $(OURCHESS.theDragCanvas).css('marginTop', '0px');
  });
}

function rotateBoard(board) {
  var origArr = $.extend(true, [], board);
  var tempArr = $.extend(true, [], board);
  for (var i = 0; i < 8; i++) {
    tempArr[i] = origArr[7 - i].reverse();
  }
  return tempArr;
}

function findMyKing(position) {
  for (var y = 0; y < 8; y++) {
    for (var x = 0; x < 8 ; x++) {
      if (position[y][x] == (OURCHESS.myColor + 'K')) {
        return { x: x, y: y };
      }
    }
  }
}