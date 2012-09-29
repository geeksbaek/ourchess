function setPosition(position, start, end, piece) {
  position[start.y][start.x] = '';
  position[end.y][end.x] = piece;
}

function getPosition(point) {
  if (!isInBoard(point)) {
    return false;
  }

  return {
    piece: piecePosition[point.y][point.x],
    point: { x: point.x, y: point.y },
    isEmpty: piecePosition[point.y][point.x] == '' ? true : false
  }
}

function getPointXY(event) {
  var e = event.changedTouches === undefined ? event : event.changedTouches[0];

  return {
    x: Math.floor((e.pageX - $(theCanvas).offset().left - Number($(theCanvas).css('border-width').replace('px', ''))) / PIECE_SIZE),
    y: Math.floor((e.pageY - $(theCanvas).offset().top - Number($(theCanvas).css('border-width').replace('px', ''))) / PIECE_SIZE)
  };
}

function setPointXY(event) {
  $(theDragCanvas).css('left', event.clientX - (PIECE_SIZE / 2) - $(theCanvas).offset().left);
  $(theDragCanvas).css('top', event.clientY - (PIECE_SIZE / 2) - $(theCanvas).offset().top);
}