function dnd() {
  document.addEventListener('mousedown', mouseDownEvent, false);
  document.addEventListener("touchstart", mouseDownEvent, true);
}

function mouseDownEvent(e) {
  var event = bindEvent(e);
  var aboutEvent = isDragPossible(event);
  if (aboutEvent === false) { return; }

  OURCHESS.dragObj = aboutEvent;

  socket.emit('dragStart', {
    myColor: OURCHESS.myColor,
    drawSquare: OURCHESS.dragObj.point,
    piece: OURCHESS.dragObj.piece
  });

  socket.emit('drag', { // 체스판을 왼쪽 상단 모서리를 기준으로 한 좌표 전송   
    myColor: OURCHESS.myColor,
    PIECE_SIZE: OURCHESS.PIECE_SIZE,
    top: event.clientY - $(OURCHESS.theCanvas).offset().top,
    left: event.clientX - $(OURCHESS.theCanvas).offset().left
  });

  $(OURCHESS.theDragCanvas).css('visibility', 'visible');

  setPointXY(event); // 드래그 캔버스의 위치를 현재 마우스 커서로 지정    

  drawSquare(OURCHESS.context, OURCHESS.dragObj.point.x, OURCHESS.dragObj.point.y); // 캔버스에 드래그를 시작한 위치의 기물의 모습을 가림
  drawPieceX(OURCHESS.dragContext, OURCHESS.dragObj.piece, 0, 0); // 드래그 캔버스에 기물의 이미지를 그림

  e.preventDefault();

  document.addEventListener('mousemove', mouseMoveEvent, false);
  document.addEventListener('mouseup', mouseUpEvent, false);

  document.addEventListener("touchmove", mouseMoveEvent, true);
  document.addEventListener("touchend", mouseUpEvent, true);
  document.addEventListener("touchcancel", mouseUpEvent, true);
}

function mouseMoveEvent(e) {
  var event = bindEvent(e);
  setPointXY(event);

  socket.emit('drag', { // 체스판을 왼쪽 상단 모서리를 기준으로 한 좌표 전송
    myColor: OURCHESS.myColor,
    PIECE_SIZE: OURCHESS.PIECE_SIZE,
    top: event.clientY - $(OURCHESS.theCanvas).offset().top,
    left: event.clientX - $(OURCHESS.theCanvas).offset().left
  });

  e.preventDefault();
}

function mouseUpEvent(e) {
  var event = bindEvent(e);
  var aboutEvent = isDropPossible(event);

  if (aboutEvent === false) { // 이동이 불가할 경우
    drawPieceX(OURCHESS.context, OURCHESS.dragObj.piece, OURCHESS.dragObj.point.x, OURCHESS.dragObj.point.y);

    socket.emit('dragEnd', {
      myColor: OURCHESS.myColor,
      possible: false,
      piece: OURCHESS.dragObj.piece,
      point: OURCHESS.dragObj.point
    });
  } else { // 이동이 가능할 경우
    var nowPoint = aboutEvent;
    
    OURCHESS.oldPiecePosition = $.extend(true, [], OURCHESS.piecePosition);

    setPosition(OURCHESS.piecePosition, OURCHESS.dragObj.point, nowPoint, OURCHESS.dragObj.piece);
    drawSquare(OURCHESS.context, nowPoint.x, nowPoint.y); // 캡쳐된 기물 지우기 (todo. 페이드 효과 추가)
    drawPieceX(OURCHESS.context, OURCHESS.dragObj.piece, nowPoint.x, nowPoint.y);

    socket.emit('dragEnd', {
      myColor: OURCHESS.myColor,
      possible: true,
      start: OURCHESS.dragObj.point,
      end: nowPoint,
      piece: OURCHESS.dragObj.piece,
    });

    // 턴 종료
    socket.emit('endOfTurn', OURCHESS.myColor);
    socket.emit('playSound', 'move');
    OURCHESS.movePermission = false;
  }

  $(OURCHESS.theDragCanvas).css('visibility', 'hidden');
  OURCHESS.theDragCanvas.width = OURCHESS.theDragCanvas.width;
  OURCHESS.theDragCanvas.height = OURCHESS.theDragCanvas.height;

  e.preventDefault();

  document.removeEventListener('mousemove', mouseMoveEvent, false);
  document.removeEventListener('mouseup', mouseUpEvent, false);

  document.removeEventListener("touchmove", mouseMoveEvent, true);
  document.removeEventListener("touchend", mouseUpEvent, true);
  document.removeEventListener("touchcancel", mouseUpEvent, true);
}

function bindEvent(event) {
  try {
    return event.changedTouches[0];
  } catch (e) {
    return event;
  }
}