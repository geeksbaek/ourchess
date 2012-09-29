function basicEvent() {
  socket.emit('join', room);

  socket.on('id', function (data) {
    myColor = data.yourColor;
    myId = data.yourId;

    if (myColor == 'Guest') {
      guestEvent();
      popup('당신은 관전자입니다.');
      socket.emit('sendMessage', { name: 'Server', message: 'Guest[' + myId + '] 입장. [인원 ' + data.length + '명]' });
    } else {
      enemyColor = data.opponentColor;
      opponentEvent();
      dnd();

      if (myColor == 'W') {
        whiteEvent();
        popup('주소를 공유해서 상대방을 초대하세요!', true);
        socket.emit('sendMessage', { name: 'Server', message: 'White 입장. [인원 ' + data.length + '명]' });
      } else {
        popup('게임을 시작합니다.');
        socket.emit('sendMessage', { name: 'Server', message: 'Black 입장. [인원 ' + data.length + '명]' });
      }
    }
  });

  socket.on('setPosition', function (data) {
    piecePosition = myColor == 'B' ? rotateBoard(data) : data;
    draw();
    $('#chessBoard').fadeIn(500);
  });

  socket.on('gameStart', function (data) {
    if (myColor == 'W') { movePermission = true; }
    check = false;
    castle = true;
    queenSideCastle = true;
    kingSideCastle = true;
    oldPiecePosition = $.extend(true, [], piecePosition);
    popup('상대방이 입장하였습니다. 게임을 시작합니다.');
  });

  socket.on('check', function (data) {
    popup('Check!');
  });

  socket.on('gameEnd', function (data) {
    popup(data);

    movePermission = false;

    $(record).text($(record).text() + 'Server : 게임이 종료되었습니다.\n');
    $(record).scrollTop($(record)[0].scrollHeight);
  });

  socket.on('chatMessage', function (data) {
    $(record).text($(record).text() + data.name + ' : ' + data.message + '\n');
    $(record).scrollTop($(record)[0].scrollHeight);
  });

  socket.on('playSoundGuys', function (data) {
    audioElement.setAttribute('src', '/sound/' + data + 'Sound' + (Math.floor(Math.random() * 4) + 1) + '.mp3');
    audioElement.play();
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
    socket.emit('broadcastPosition', { id: data.id, position: piecePosition });
  });
}

function opponentEvent() {
  socket.on('turnOff', function (data) {
    if (data == myColor) { movePermission = true; }
  });

  socket.on('castle_opponent', function (data) {
    drawSquare(context, Math.abs(7 - data.oldRook.x), Math.abs(7 - data.oldRook.y));
    drawPieceX(context, data.myColor + 'R', Math.abs(7 - data.newRook.x), Math.abs(7 - data.newRook.y));
    setPosition(piecePosition, { x: Math.abs(7 - data.oldRook.x), y: Math.abs(7 - data.oldRook.y) }, { x: Math.abs(7 - data.newRook.x), y: Math.abs(7 - data.newRook.y) }, data.myColor + 'R');
  });

  socket.on('enPassant_opponent', function (data) {
    piecePosition[Math.abs(7 - data.y)][Math.abs(7 - data.x)] = '';
    drawSquare(context, Math.abs(7 - data.x), Math.abs(7 - data.y));
  });

  socket.on('dragStart_opponent', function (data) {
    drawSquare(context, Math.abs(7 - data.drawSquare.x), Math.abs(7 - data.drawSquare.y));
    drawPieceX(dragContext, data.piece, 0, 0);
    theDragCanvas.style.visibility = 'visible';
  });

  socket.on('drag_opponent', function (data) {
    $(theDragCanvas).css('top', 0 - (data.top * (PIECE_SIZE / data.PIECE_SIZE)) - (PIECE_SIZE / 2) + (PIECE_SIZE * 8) + ($(theCanvas).outerWidth() - $(theCanvas).width()));
    $(theDragCanvas).css('left', 0 - (data.left * (PIECE_SIZE / data.PIECE_SIZE)) - (PIECE_SIZE / 2) + (PIECE_SIZE * 8) + ($(theCanvas).outerWidth() - $(theCanvas).width()));
  });

  socket.on('dragEnd_opponent', function (data) {
    if (data.possible == false) {
      drawPieceX(context, data.piece, Math.abs(7 - data.point.x), Math.abs(7 - data.point.y));
    } else {
      oldPiecePosition = $.extend(true, [], piecePosition);
      setPosition(piecePosition, { x: Math.abs(7 - data.start.x), y: Math.abs(7 - data.start.y) }, { x: Math.abs(7 - data.end.x), y: Math.abs(7 - data.end.y) }, data.piece);
      drawSquare(context, Math.abs(7 - data.end.x), Math.abs(7 - data.end.y)); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
      drawPieceX(context, data.piece, Math.abs(7 - data.end.x), Math.abs(7 - data.end.y));
    }

    theDragCanvas.style.visibility = 'hidden';
    theDragCanvas.width = theDragCanvas.width;
    theDragCanvas.height = theDragCanvas.height;

    var _isCheck = isDengerousOrSafe(piecePosition, findMyKing(piecePosition));
    if (_isCheck.bool) {
      if (isCheckmate(piecePosition, findMyKing(piecePosition), _isCheck.attacker).bool) {
        movePermission = false;
        socket.emit('gameEnd', 'Checkmate!');
      } else {
        check = true;
        socket.emit('check', {});
      }
    } else {
      if (isStalemate(piecePosition)) {
        movePermission = false;
        socket.emit('gameEnd', 'Stalemate!');
      } else {
        check = false;
      }
    }
  });
}

function guestEvent() {
  socket.on('castle_guest', function (data) {
    if (data.myColor == 'W') {
      drawSquare(context, data.oldRook.x, data.oldRook.y);
      drawPieceX(context, data.myColor + 'R', data.newRook.x, data.newRook.y);
      setPosition(piecePosition, oldRook, newRook, data.myColor + 'R');
    } else {
      drawSquare(context, Math.abs(7 - data.oldRook.x), Math.abs(7 - data.oldRook.y));
      drawPieceX(context, data.drawPieceX_piece, Math.abs(7 - data.newRook.x), Math.abs(7 - data.newRook.y));
      setPosition(piecePosition, { x: Math.abs(7 - data.oldRook.x), y: Math.abs(7 - data.oldRook.y) }, { x: Math.abs(7 - data.newRook.x), y: Math.abs(7 - data.newRook.y) }, data.myColor + 'R');
    }
  });

  socket.on('enPassant_guest', function (data) {
    if (data.myColor == 'W') {
      piecePosition[data.y][data.x] = '';
      drawSquare(context, data.x, data.y);
    } else {
      piecePosition[Math.abs(7 - data.y)][Math.abs(7 - data.x)] = '';
      drawSquare(context, Math.abs(7 - data.x), Math.abs(7 - data.y));
    }
  });

  socket.on('dragStart_guest', function (data) {
    if (data.myColor == 'W') { // 백의 이동에 대한 게스트 보드의 움직임
      drawSquare(context, data.drawSquare.x, data.drawSquare.y);
      drawPieceX(dragContext, data.piece, 0, 0);
      theDragCanvas.style.visibility = 'visible';
    } else if (data.myColor == 'B') { // 흑의 이동에 대한 게스트 보드의 움직임
      drawSquare(context, Math.abs(7 - data.drawSquare.x), Math.abs(7 - data.drawSquare.y));
      drawPieceX(dragContext, data.piece, 0, 0);
      theDragCanvas.style.visibility = 'visible';
    }
  });

  socket.on('drag_guest', function (data) {
    if (data.myColor == 'W') { // 백의 이동에 대한 게스트 보드의 움직임
      $(theDragCanvas).css('top', (data.top * (PIECE_SIZE / data.PIECE_SIZE)) - (PIECE_SIZE / 2));
      $(theDragCanvas).css('left', (data.left * (PIECE_SIZE / data.PIECE_SIZE)) - (PIECE_SIZE / 2));
    } else if (data.myColor == 'B') { // 흑의 이동에 대한 게스트 보드의 움직임
      $(theDragCanvas).css('top', 0 - (data.top * (PIECE_SIZE / data.PIECE_SIZE)) - (PIECE_SIZE / 2) + (PIECE_SIZE * 8) + ($(theCanvas).outerWidth() - $(theCanvas).width()));
      $(theDragCanvas).css('left', 0 - (data.left * (PIECE_SIZE / data.PIECE_SIZE)) - (PIECE_SIZE / 2) + (PIECE_SIZE * 8) + ($(theCanvas).outerWidth() - $(theCanvas).width()));
    }
  });

  socket.on('dragEnd_guest', function (data) {
    if (data.myColor == 'W') { // 백의 이동에 대한 게스트 보드의 움직임
      if (data.possible == false) {
        drawPieceX(context, data.piece, data.point.x, data.point.y);
      } else {
        setPosition(piecePosition, data.start, data.end, data.piece);
        drawSquare(context, data.end.x, data.end.y); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
        drawPieceX(context, data.piece, data.end.x, data.end.y);
      }
    } else if (data.myColor == 'B') { // 흑의 이동에 대한 게스트 보드의 움직임
      if (data.possible == false) {
        drawPieceX(context, data.piece, Math.abs(7 - data.point.x), Math.abs(7 - data.point.y));
      } else {
        setPosition(piecePosition, { x: Math.abs(7 - data.start.x), y: Math.abs(7 - data.start.y) }, { x: Math.abs(7 - data.end.x), y: Math.abs(7 - data.end.y) }, data.piece);
        drawSquare(context, Math.abs(7 - data.end.x), Math.abs(7 - data.end.y)); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
        drawPieceX(context, data.piece, Math.abs(7 - data.end.x), Math.abs(7 - data.end.y));
      }
    }

    theDragCanvas.style.visibility = 'hidden';
    theDragCanvas.width = theDragCanvas.width;
    theDragCanvas.height = theDragCanvas.height;

    theDragCanvas.style.marginLeft = '0px';
    theDragCanvas.style.marginTop = '0px';
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
      if (position[y][x] == (myColor + 'K')) {
        return { x: x, y: y };
      }
    }
  }
}