function setPosition(position, start, end, piece) {
  position[start.y][start.x] = '';
  position[end.y][end.x] = piece;
}

function getPosition(point) {
  if (!isInBoard(point)) {
    return false;
  }

  return {
    piece: OURCHESS.piecePosition[point.y][point.x],
    point: { x: point.x, y: point.y },
    isEmpty: OURCHESS.piecePosition[point.y][point.x] == '' ? true : false
  }
}

function getPointXY(event) {
  var e = event.changedTouches === undefined ? event : event.changedTouches[0];

  return {
    x: Math.floor((
        e.pageX - $(OURCHESS.theCanvas).offset().left -
        Number($(OURCHESS.theCanvas).css('border-width').replace('px', ''))) /
        OURCHESS.PIECE_SIZE
      ),

    y: Math.floor((
        e.pageY - $(OURCHESS.theCanvas).offset().top -
        Number($(OURCHESS.theCanvas).css('border-width').replace('px', ''))) /
        OURCHESS.PIECE_SIZE
      )
  };
}

function setPointXY(event) {
  $(OURCHESS.theDragCanvas).css('left',
     event.clientX - (OURCHESS.PIECE_SIZE / 2) -
     $(OURCHESS.theCanvas).offset().left +
     Number(OURCHESS.chessBoardDiv.css('paddingLeft').replace('px', ''))
   );
  $(OURCHESS.theDragCanvas).css('top',
    event.clientY -
     (OURCHESS.PIECE_SIZE / 2) -
     $(OURCHESS.theCanvas).offset().top +
     Number(OURCHESS.chessBoardDiv.css('paddingLeft').replace('px', ''))
   );
}