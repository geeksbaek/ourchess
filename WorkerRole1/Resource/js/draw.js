function draw() {
    this.drawBoard = function () {
        for (var y = 0; y < 8; y++) {
            for (var x = 0; x < 8; x++) {
                drawSquare(context, x, y);
            }
        }
    }

    this.drawSquare = function (context, x, y) {
        context.save();
        context.fillStyle = myColor != 'B' ? (x ^ y) & 1 ? 'grey' : 'whitesmoke' : (x ^ y) & 1 ? 'whitesmoke' : 'grey';
        context.fillRect(x * PIECE_SIZE, y * PIECE_SIZE, PIECE_SIZE, PIECE_SIZE);
        context.restore();
    }

    this.drawPiece = function () {
        this.drawPieceX = function (context, piece, x, y) {
            var img = new Image();
            img.src = '/img/' + piece + '.png';
            img.onload = function () {
                context.save();
                context.shadowOffsetX = 2;
                context.shadowOffsetY = 2;
                context.shadowBlur = 2;
                context.shadowColor = 'rgba(0, 0, 0, 0.5)';
                context.drawImage(img, x * PIECE_SIZE, y * PIECE_SIZE, PIECE_SIZE, PIECE_SIZE);
                context.restore();
            }
        }

        for (var y = 0; y < 8; y++) {
            for (var x = 0; x < 8; x++) {
                if (piecePosition[y][x] != '') {
                    drawPieceX(context, piecePosition[y][x], x, y);
                }
            }
        }
    }

    drawBoard();
    drawPiece();
}