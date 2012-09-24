function basicEvent() {
    socket.emit('join', room);

    socket.on('id', function (data) {
        console.log(data);
        if (data.color == 'Guest') {
            piecePosition = data.position;
            guestEvent();
        } else if (data.color == 'B') {
            piecePosition = rotateBoard(data.position);
            OpponentEvent();
            dnd();
        } else if (data.color == 'W') {            
            piecePosition = data.position;
            OpponentEvent();
            dnd();
        }

        myColor = data.color;
        draw();
    });

    socket.on('gameStart', function (data) {
        if (myColor == 'W') {
            movePermission = true;
        }
    });    

    socket.on('disconnect', function (data) {
        // alert('서버와의 연결이 끊겼습니다.');
    });
}

function OpponentEvent() {
    socket.on('turnOff', function (data) {
        if (data == myColor) {
            movePermission = true;
        }
    });

    socket.on('castle_opponent', function (data) {
        drawSquare(context, Math.abs(7 - data.drawSquare_x), Math.abs(7 - data.drawSquare_y));
        drawPieceX(context, data.drawPieceX_piece, Math.abs(7 - data.drawPieceRook_x), Math.abs(7 - data.drawPieceRook_y));
        setPosition(piecePosition, { x: Math.abs(7 - data.setPosition_start_x), y: Math.abs(7 - data.setPosition_start_y) }, { x: Math.abs(7 - data.setPosition_end_x), y: Math.abs(7 - data.setPosition_end_y) }, data.myColor + 'R');
    });
    
    socket.on('enPassant_opponent', function (data) {
        piecePosition[Math.abs(7 - data.y)][Math.abs(7 - data.x)] = '';
        drawSquare(context, Math.abs(7 - data.x), Math.abs(7 - data.y));
    });

    socket.on('dragStart_opponent', function (data) {
        drawSquare(context, Math.abs(7 - data.drawSquare_x), Math.abs(7 - data.drawSquare_y));
        drawPieceX(dragContext, data.drawPieceX_piece, 0, 0);
        theDragCanvas.style.visibility = 'visible';
    });

    socket.on('drag_opponent', function (data) {
        var leftMargin = 0 - (data.leftMargin * (PIECE_SIZE / data.PIECE_SIZE)) + (PIECE_SIZE * 7) + 8;
        var topMargin = 0 - (data.topMargin * (PIECE_SIZE / data.PIECE_SIZE)) + (PIECE_SIZE * 7) + 8;

        theDragCanvas.style.marginLeft = leftMargin + Number($(chessBoardDiv).offset().left) + (PIECE_SIZE / 2) + 'px';
        theDragCanvas.style.marginTop = topMargin + Number($(chessBoardDiv).offset().top) + (PIECE_SIZE / 2) + 'px';
    });

    socket.on('dragEnd_opponent', function (data) {
        if (data.possible == false) {
            drawPieceX(context, data.drawPiece_piece, Math.abs(7 - data.drawPiece_x), Math.abs(7 - data.drawPiece_y));
        } else {
            oldPiecePosition = $.extend(true, [], piecePosition);
            setPosition(piecePosition, { x: Math.abs(7 - data.setPosition_p_x), y: Math.abs(7 - data.setPosition_p_y) }, { x: Math.abs(7 - data.setPosition_getPosition_x), y: Math.abs(7 - data.setPosition_getPosition_y) }, data.setPosition_piece);
            drawSquare(context, Math.abs(7 - data.drawPieceAndSquare_x), Math.abs(7 - data.drawPieceAndSquare_y)); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
            drawPieceX(context, data.drawPieceAndSquare_piece, Math.abs(7 - data.drawPieceAndSquare_x), Math.abs(7 - data.drawPieceAndSquare_y));
        }

        theDragCanvas.style.visibility = 'hidden';
        dragContext.clearRect(0, 0, theDragCanvas.width, theDragCanvas.height);

        var _isCheck = itCanBeAttackedOrDepended(piecePosition, findMyKing(piecePosition));
        if (_isCheck.bool) {
            if (isCheckmate(piecePosition, findMyKing(piecePosition), _isCheck.attacker)) {
                movePermission = false;
                alert('Checkmate!');
            } else {
                check = true;
                alert('Check!');
            }
        } else {
            check = false;
        }
    });
}

function guestEvent() {
    socket.on('castle_guest', function (data) {
        if (data.myColor == 'W') {
            drawSquare(context, data.drawSquare_x, data.drawSquare_y);
            drawPieceX(context, data.drawPieceX_piece, data.drawPieceRook_x, data.drawPieceRook_y);
            setPosition(piecePosition, { x: data.setPosition_start_x, y: data.setPosition_start_y }, { x: data.setPosition_end_x, y: data.setPosition_end_y }, data.myColor + 'R');
        } else {
            drawSquare(context, Math.abs(7 - data.drawSquare_x), Math.abs(7 - data.drawSquare_y));
            drawPieceX(context, data.drawPieceX_piece, Math.abs(7 - data.drawPieceRook_x), Math.abs(7 - data.drawPieceRook_y));
            setPosition(piecePosition, { x: Math.abs(7 - data.setPosition_start_x), y: Math.abs(7 - data.setPosition_start_y) }, { x: Math.abs(7 - data.setPosition_end_x), y: Math.abs(7 - data.setPosition_end_y) }, data.myColor + 'R');
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
            drawSquare(context, data.drawSquare_x, data.drawSquare_y);
            drawPieceX(dragContext, data.drawPieceX_piece, 0, 0);
            theDragCanvas.style.visibility = 'visible';
        } else if (data.myColor == 'B') { // 흑의 이동에 대한 게스트 보드의 움직임
            drawSquare(context, Math.abs(7 - data.drawSquare_x), Math.abs(7 - data.drawSquare_y));
            drawPieceX(dragContext, data.drawPieceX_piece, 0, 0);
            theDragCanvas.style.visibility = 'visible';
        }
    });

    socket.on('drag_guest', function (data) {
        if (data.myColor == 'W') { // 백의 이동에 대한 게스트 보드의 움직임
            theDragCanvas.style.marginLeft = (data.leftMargin * (PIECE_SIZE / data.PIECE_SIZE)) + Number($(chessBoardDiv).offset().left) - (PIECE_SIZE / 2) + 'px';
            theDragCanvas.style.marginTop = (data.topMargin * (PIECE_SIZE / data.PIECE_SIZE)) + Number($(chessBoardDiv).offset().top) - (PIECE_SIZE / 2) + 'px';
        } else if (data.myColor == 'B') { // 흑의 이동에 대한 게스트 보드의 움직임
            var leftMargin = 0 - (data.leftMargin * (PIECE_SIZE / data.PIECE_SIZE)) + (PIECE_SIZE * 7) + 8;
            var topMargin = 0 - (data.topMargin * (PIECE_SIZE / data.PIECE_SIZE)) + (PIECE_SIZE * 7) + 8;

            theDragCanvas.style.marginLeft = leftMargin + Number($(chessBoardDiv).offset().left) + (PIECE_SIZE / 2) + 'px';
            theDragCanvas.style.marginTop = topMargin + Number($(chessBoardDiv).offset().top) + (PIECE_SIZE / 2) + 'px';
        }
    });

    socket.on('dragEnd_guest', function (data) {
        if (data.myColor == 'W') { // 백의 이동에 대한 게스트 보드의 움직임
            if (data.possible == false) {
                drawPieceX(context, data.drawPiece_piece, data.drawPiece_x, data.drawPiece_y);
            } else {
                setPosition(piecePosition, { x: data.setPosition_p_x, y: data.setPosition_p_y }, { x: data.setPosition_getPosition_x, y: data.setPosition_getPosition_y }, data.setPosition_piece);
                drawSquare(context, data.drawPieceAndSquare_x, data.drawPieceAndSquare_y); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
                drawPieceX(context, data.drawPieceAndSquare_piece, data.drawPieceAndSquare_x, data.drawPieceAndSquare_y);
            }
        } else if (data.myColor == 'B') { // 흑의 이동에 대한 게스트 보드의 움직임
            if (data.possible == false) {
                drawPieceX(context, data.drawPiece_piece, Math.abs(7 - data.drawPiece_x), Math.abs(7 - data.drawPiece_y));
            } else {
                setPosition(piecePosition, { x: Math.abs(7 - data.setPosition_p_x), y: Math.abs(7 - data.setPosition_p_y) }, { x: Math.abs(7 - data.setPosition_getPosition_x), y: Math.abs(7 - data.setPosition_getPosition_y) }, data.setPosition_piece);
                drawSquare(context, Math.abs(7 - data.drawPieceAndSquare_x), Math.abs(7 - data.drawPieceAndSquare_y)); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
                drawPieceX(context, data.drawPieceAndSquare_piece, Math.abs(7 - data.drawPieceAndSquare_x), Math.abs(7 - data.drawPieceAndSquare_y));
            }
        }

        theDragCanvas.style.visibility = 'hidden';
        dragContext.clearRect(0, 0, theDragCanvas.width, theDragCanvas.height);

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