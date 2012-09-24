function setPosition(position, start, end, piece) {
    position[start.y][start.x] = '';
    position[end.y][end.x] = piece;
}

function getPosition(p) {
    if (!isInBoard(p)) {
        return false;
    }

    var x = Math.floor(p.x);
    var y = Math.floor(p.y) % 8;

    return {
        piece: piecePosition[y][x],
        p: { x: x, y: y },
        isEmpty: piecePosition[y][x] == '' ? true : false
    }
}

function getPointXY(event) {
    return {
        x: (event.pageX - $(theCanvas).position().left) / PIECE_SIZE,
        y: (event.pageY - $(theCanvas).position().top) / PIECE_SIZE
    };
}

function setPointXY(event) {
    theDragCanvas.style.marginLeft = (event.clientX - (PIECE_SIZE / 2)) + 'px';
    theDragCanvas.style.marginTop = (event.clientY - (PIECE_SIZE / 2)) + 'px';    
}