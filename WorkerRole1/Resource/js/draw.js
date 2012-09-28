function draw() {
  this.drawBoard = function () {
    for (var y = 0; y < 8; y++) {
      for (var x = 0; x < 8; x++) {
        drawSquare(context, x, y);
      }
    }
  }

  this.blackColor = '#b58863';
  this.WhiteColor = '#f0d9b5';

  this.drawSquare = function (context, x, y) {
    context.save();
    context.fillStyle = myColor != 'B' ? (x ^ y) & 1 ? blackColor : WhiteColor : (x ^ y) & 1 ? WhiteColor : blackColor;
    context.fillRect(x * PIECE_SIZE, y * PIECE_SIZE, PIECE_SIZE, PIECE_SIZE);
    context.restore();

    if (x == 0) {
      context.save();
      context.font = '10px serif';
      context.fillStyle = myColor == 'B' ? (x ^ y) & 1 ? blackColor : WhiteColor : (x ^ y) & 1 ? WhiteColor : blackColor;
      context.fillText(Math.abs(8 - y), (x * PIECE_SIZE) + 2, (y * PIECE_SIZE) + 11);
      context.restore();
    }

    if (y == 7) {
      context.save();
      context.font = '10px serif';
      context.fillStyle = myColor == 'B' ? (x ^ y) & 1 ? blackColor : WhiteColor : (x ^ y) & 1 ? WhiteColor : blackColor;
      context.fillText(String.fromCharCode('A'.charCodeAt(0) + x), (x * PIECE_SIZE) + (PIECE_SIZE - 9), (y * PIECE_SIZE) + (PIECE_SIZE - 2));
      context.restore();
    }
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