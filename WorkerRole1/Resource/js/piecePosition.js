function setPosition(position, start, end, piece) {
    position[start.x][start.y] = '';
    position[end.x][end.y] = piece;
}

function getPosition(p) {
    if (!isInBoard(p)) {
        return false;
    }

    var y = Math.floor(p.x);
    var x = Math.floor(p.y) % 8;

    return {
        piece: piecePosition[x][y],
        p: { x: x, y: y },
        isEmpty: piecePosition[x][y] == '' ? true : false
    }
}

function getPointXY(event) {
    p = {
        x: (event.pageX - $(theCanvas).position().left) / PIECE_SIZE,
        y: (event.pageY - $(theCanvas).position().top) / PIECE_SIZE
    }
    return p;
}

function setPointXY(event) {
    theDragCanvas.style.marginTop = (event.clientY - (PIECE_SIZE / 2)) + 'px';
    theDragCanvas.style.marginLeft = (event.clientX - (PIECE_SIZE / 2)) + 'px';
}