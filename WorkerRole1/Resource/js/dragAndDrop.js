function dnd() {
    document.addEventListener('mousedown', mouseDownEvent, false);
    document.addEventListener("touchstart", touchHandler, true);
    document.addEventListener("touchmove", touchHandler, true);
    document.addEventListener("touchend", touchHandler, true);
    document.addEventListener("touchcancel", touchHandler, true);
}

function touchHandler(event) {
    var touches = event.changedTouches,
    first = touches[0],
    type = "";

    switch (event.type) {
        case "touchstart": type = "mousedown"; break;
        case "touchmove": type = "mousemove"; break;
        case "touchend": type = "mouseup"; break;
        default: return;
    }

    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0, null);

    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
}

function mouseDownEvent(event) {
    var possible = isDragPossible(event);

    if (possible == false) {
        return;
    }

    var p = possible[0];
    dragObj = possible[1];

    socket.emit('dragStart', {
        myColor: myColor,
        drawSquare_x: Math.floor(p.x),
        drawSquare_y: Math.floor(p.y),
        drawPieceX_piece: dragObj.piece
    });

    socket.emit('drag', { // 체스판을 왼쪽 상단 모서리를 기준으로 한 좌표 전송   
        myColor: myColor,
        PIECE_SIZE: PIECE_SIZE,
        topMargin: event.pageY - Number($(chessBoardDiv).offset().top),
        leftMargin: event.pageX - Number($(chessBoardDiv).offset().left)
    });

    theDragCanvas.style.visibility = 'visible';

    setPointXY(event); // 드래그 캔버스의 위치를 현재 마우스 커서로 지정    

    drawSquare(context, Math.floor(p.x), Math.floor(p.y)); // 캔버스에 드래그를 시작한 위치의 기물의 모습을 가림
    drawPieceX(dragContext, dragObj.piece, 0, 0); // 드래그 캔버스에 기물의 이미지를 그림

    document.addEventListener('mousemove', mouseMoveEvent, false);
    document.addEventListener('mouseup', mouseUpEvent, false);
}

function mouseUpEvent(event) {
    var possible = isDropPossible(event);

    if (possible == false) { // 이동이 불가할 경우
        drawPieceX(context, dragObj.piece, Math.floor(dragObj.p.y), Math.floor(dragObj.p.x));

        socket.emit('dragEnd', {
            myColor: myColor,
            possible: false,
            drawPiece_piece: dragObj.piece,
            drawPiece_x: Math.floor(dragObj.p.y),
            drawPiece_y: Math.floor(dragObj.p.x)
        });
    } else { // 이동이 가능할 경우
        var p = possible;
        setPosition(piecePosition, dragObj.p, getPosition(p).p, dragObj.piece);
        drawSquare(context, Math.floor(p.x), Math.floor(p.y)); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
        drawPieceX(context, dragObj.piece, Math.floor(p.x), Math.floor(p.y));

        socket.emit('dragEnd', {
            myColor: myColor,
            possible: true,
            setPosition_p_x: dragObj.p.x,
            setPosition_p_y: dragObj.p.y,
            setPosition_getPosition_x: getPosition(p).p.x,
            setPosition_getPosition_y: getPosition(p).p.y,
            setPosition_piece: dragObj.piece,
            drawPieceAndSquare_piece: dragObj.piece,
            drawPieceAndSquare_x: Math.floor(p.x),
            drawPieceAndSquare_y: Math.floor(p.y)
        });

        // 턴 종료
        socket.emit('endOfTurn', myColor);
        movePermission = false;
    }

    if (myColor == 'W') { // jQuery의 extend 메소드(Deep Copy)를 이용하기 위해 클라이언트 사이드에서 회전하여 보낸다.
        socket.emit('positionUpdate', { room: room, position: piecePosition });
    } else if (myColor == 'B') {
        socket.emit('positionUpdate', { room: room, position: rotateBoard(piecePosition) });
    }

    theDragCanvas.style.visibility = 'hidden';
    dragContext.clearRect(0, 0, theDragCanvas.width, theDragCanvas.height);

    theDragCanvas.style.marginTop = '0px';
    theDragCanvas.style.marginLeft = '0px';

    document.removeEventListener('mousemove', mouseMoveEvent, false);
    document.removeEventListener('mouseup', mouseUpEvent, false);
}

function mouseMoveEvent(event) {
    setPointXY(event);

    socket.emit('drag', { // 체스판을 왼쪽 상단 모서리를 기준으로 한 좌표 전송
        myColor: myColor,
        PIECE_SIZE: PIECE_SIZE,
        topMargin: event.pageY - Number($(chessBoardDiv).offset().top),
        leftMargin: event.pageX - Number($(chessBoardDiv).offset().left)
    });
}