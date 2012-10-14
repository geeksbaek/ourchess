function draw(clear) {
  if (clear === true) {
    cleartheCanvas();
    cleartheDragCanvas();
  }

  drawBoard();
  drawPiece();
}

function drawBoard() {
  for (var y = 0; y < 8; y++) {
    for (var x = 0; x < 8; x++) {
      drawSquare(OURCHESS.context, x, y);
    }
  }
}

function drawSquare(context, x, y) {
  context.save();
  context.fillStyle = OURCHESS.myColor != 'B' ? (x ^ y) & 1 ? OURCHESS.blackColor : OURCHESS.WhiteColor : (x ^ y) & 1 ? OURCHESS.WhiteColor : OURCHESS.blackColor;
  context.fillRect(x * OURCHESS.PIECE_SIZE, y * OURCHESS.PIECE_SIZE, OURCHESS.PIECE_SIZE, OURCHESS.PIECE_SIZE);
  context.restore();

  if (x == 0) {
    context.save();
    context.font = '10px serif';
    context.fillStyle = OURCHESS.myColor == 'B' ? (x ^ y) & 1 ? OURCHESS.blackColor : OURCHESS.WhiteColor : (x ^ y) & 1 ? OURCHESS.WhiteColor : OURCHESS.blackColor;
    context.fillText(OURCHESS.myColor == 'B' ? y + 1 : Math.abs(8 - y), (x * OURCHESS.PIECE_SIZE) + 2, (y * OURCHESS.PIECE_SIZE) + 11);
    context.restore();
  }

  if (y == 7) {
    context.save();
    context.font = '10px serif';
    context.fillStyle = OURCHESS.myColor == 'B' ? (x ^ y) & 1 ? OURCHESS.blackColor : OURCHESS.WhiteColor : (x ^ y) & 1 ? OURCHESS.WhiteColor : OURCHESS.blackColor;
    context.fillText(String.fromCharCode(OURCHESS.myColor == 'B' ? 'H'.charCodeAt(0) - x : 'A'.charCodeAt(0) + x), (x * OURCHESS.PIECE_SIZE) + (OURCHESS.PIECE_SIZE - 9), (y * OURCHESS.PIECE_SIZE) + (OURCHESS.PIECE_SIZE - 2));
    context.restore();
  }
}

function drawPiece() {
  for (var y = 0; y < 8; y++) {
    for (var x = 0; x < 8; x++) {
      if (OURCHESS.piecePosition[y][x] != '') {
        drawPieceX(OURCHESS.context, OURCHESS.piecePosition[y][x], x, y);
      }
    }
  }
}

function drawPieceX(context, piece, x, y) {
  context.save();
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;
  context.shadowBlur = 2;
  context.shadowColor = 'rgba(0, 0, 0, 0.5)';
  context.drawImage(OURCHESS.loadedPiece[piece], x * OURCHESS.PIECE_SIZE, y * OURCHESS.PIECE_SIZE, OURCHESS.PIECE_SIZE, OURCHESS.PIECE_SIZE);
  context.restore();
}