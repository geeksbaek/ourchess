function isDragPossible(event) {
  var startPoint = getPointXY(event);
  var startPiece = getPosition(startPoint);

  if (!isInBoard(startPoint)) {
    return false;
  }

  if (OURCHESS.movePermission == false) {
    return false;
  }

  if (startPiece.piece.charAt(0) != OURCHESS.myColor) {
    return false;
  }

  if (startPiece.piece == '') {
    return false;
  }

  return startPiece;
}

function isDropPossible(event) {
  var endPoint = getPointXY(event);
  var endPiece = getPosition(endPoint);

  if (!isInBoard(endPoint)) {
    return false;
  }

  if (OURCHESS.dragObj.piece.charAt(0) == endPiece.piece.charAt(0)) {
    return false;
  }

  if (!isRightRule(OURCHESS.dragObj.piece.charAt(1), endPoint)) {
    return false;
  }

  var previewPosition = $.extend(true, [], OURCHESS.piecePosition);
  setPosition(previewPosition, OURCHESS.dragObj.point, endPoint, OURCHESS.dragObj.piece);

  if (isDengerousOrSafe(previewPosition, findMyKing(previewPosition)).bool) {
    return false;
  }

  return endPoint;
}

function isInBoard(p) {
  if (p.x >= 0 && p.x < 8 && p.y >= 0 && p.y < 8) {
    return true;
  } else {
    return false;
  }
}

function isRightRule(piece, endPoint) {
  var result = true;
  var pointArgs = {
    start: OURCHESS.dragObj.point,
    end: endPoint
  }

  switch (piece) {
    case 'P':
      result = pawnRule(pointArgs);
      break;
    case 'R':
      result = rookRule(pointArgs);
      if (result == true) {
        if (OURCHESS.dragObj.point.y == 7 && OURCHESS.dragObj.point.x == 0) {
          if (OURCHESS.myColor == 'W') {
            OURCHESS.queenSideCastle = false;
          } else {
            OURCHESS.kingSideCastle = false;
          }
        } else if (OURCHESS.dragObj.point.y == 7 && OURCHESS.dragObj.point.x == 7) {
          if (OURCHESS.myColor == 'W') {
            OURCHESS.kingSideCastle = false;
          } else {
            OURCHESS.queenSideCastle = false;
          }
        }
      }
      break;
    case 'N':
      result = knightRule(pointArgs);
      break;
    case 'B':
      result = bishopRule(pointArgs);
      break;
    case 'Q':
      result = queenRule(pointArgs);
      break;
    case 'K':
      result = kingRule(pointArgs);
      if (result == true) { // 한번이라도 움직일 시 캐슬 불가
        OURCHESS.kingSideCastle = false;
        OURCHESS.queenSideCastle = false;
        OURCHESS.castle = false;
      }
      break;
  }

  return result;
}

function pawnRule(p) {
  if (p.start.x == p.end.x && p.start.y > p.end.y) { // 수직으로 위로 이동할 때
    if (p.start.y - p.end.y > 2) { // 2칸 초과 이동
      return false;
    } else if (p.start.y - p.end.y == 2) { // 2칸 이동
      if (Math.floor(p.start.y) != 6) { // 시작 지점 아닐 경우 false
        return false
      } else {
        if (getPosition(p.end).isEmpty && getPosition({ x: p.end.x, y: p.end.y + 1 }).isEmpty) {
          return true;
        } else {
          return false;
        }
      }
    } else if (p.start.y - p.end.y == 1) { // 1칸 이동
      if (getPosition(p.end).isEmpty) {
        if (p.end.y == 0) { // 프로모션
          OURCHESS.dragObj.piece = OURCHESS.myColor + 'Q';
        }
        return true;
      }
    } else {
      return false;
    }
  } else if (Math.abs(p.start.x - p.end.x) == 1 && p.start.y - p.end.y == 1) { // 대각선 1칸 캡처
    if (!getPosition(p.end).isEmpty) {
      if (p.end.y == 0) { // 프로모션
        OURCHESS.dragObj.piece = OURCHESS.myColor + 'Q';
      }
      return true;
    } else { // 대각선 1칸 이동이지만 해당 위치가 빈 블록일 때
      if (isEnPassant(OURCHESS.piecePosition, OURCHESS.oldPiecePosition, p.start, p.end, (OURCHESS.myColor == 'W' ? 'B' : 'W') + 'P')) { // 앙파상일 때
        OURCHESS.piecePosition[p.start.y][p.end.x] = '';
        drawSquare(OURCHESS.context, p.end.x, p.start.y);
        socket.emit('enPassant', { x: p.end.x, y: p.start.y, myColor: OURCHESS.myColor });
        return true;
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
}

function rookRule(p) {
  return horizontalAndVerticalCheck(p.start, p.end);
}

function knightRule(p) {
  if (Math.abs(p.start.x - p.end.x) == 2 && Math.abs(p.start.y - p.end.y) == 1) {
    return true;
  } else if (Math.abs(p.start.x - p.end.x) == 1 && Math.abs(p.start.y - p.end.y) == 2) {
    return true;
  } else {
    return false;
  }
}

function bishopRule(p) {
  return diagonalCheck(p.start, p.end);
}

function queenRule(p) {
  if (diagonalCheck(p.start, p.end) || horizontalAndVerticalCheck(p.start, p.end)) {
    return true;
  } else {
    return false;
  }
}

function kingRule(p) {
  if (Math.abs(p.start.x - p.end.x) <= 1 && Math.abs(p.start.y - p.end.y) <= 1) {
    return true;
  } else if (p.start.y == p.end.y && Math.abs(p.start.x - p.end.x) == 2 && OURCHESS.castle && !OURCHESS.check) { // 캐슬
    return castleCheck(p.start, p.end);
  } else {
    return false;
  }
}

function diagonalCheck(start, end) {
  if (Math.abs(start.x - end.x) != Math.abs(start.y - end.y)) { // 대각선 이동이 아닐 때
    return false;
  } else {
    if (start.x < end.x && start.y < end.y) { // 오른쪽 아래로 이동할 때
      for (var i = start.x + 1, j = start.y + 1; i < end.x; i++, j++) {
        if (!getPosition({ x: i, y: j }).isEmpty) {
          return false;
        }
      }
      return true;
    } else if (start.x < end.x && start.y > end.y) { // 오른쪽 위로 이동할 때
      for (var i = start.x + 1, j = start.y - 1; i < end.x; i++, j--) {
        if (!getPosition({ x: i, y: j }).isEmpty) {
          return false;
        }
      }
      return true;
    } else if (start.x > end.x && start.y < end.y) { // 왼쪽 아래로 이동할 때
      for (var i = start.x - 1, j = start.y + 1; i > end.x; i--, j++) {
        if (!getPosition({ x: i, y: j }).isEmpty) {
          return false;
        }
      }
      return true;
    } else if ((start.x > end.x && start.y > end.y)) { // 왼쪽 위로 이동할 때
      for (var i = start.x - 1, j = start.y - 1; i > end.x; i--, j--) {
        if (!getPosition({ x: i, y: j }).isEmpty) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }
}

function horizontalAndVerticalCheck(start, end) {
  if (start.x == end.x) { // 수직
    return verticalCheck(start, end);
  } else if (start.y == end.y) { // 수평
    return horizontalCheck(start, end);
  } else {
    return false;
  }
}

function horizontalCheck(start, end) {
  if (start.x < end.x) { // 왼쪽에서 오른쪽으로
    for (var i = start.x + 1; i < end.x; i++) {
      if (!getPosition({ x: i, y: start.y }).isEmpty) {
        return false;
      }
    }
  } else if (start.x > end.x) { // 오른쪽에서 왼쪽으로
    for (var i = end.x + 1; i < start.x; i++) {
      if (!getPosition({ x: i, y: start.y }).isEmpty) {
        return false;
      }
    }
  }

  if (OURCHESS.myColor == 'W') {
    if (start.x == 0 && start.y == 7) { // 퀸사이드 캐슬 불가능
      OURCHESS.queenSideCastle = false;
    } else if (start.x == 7 && start.y == 7) { // 킹사이드 캐슬 불가능
      OURCHESS.kingSideCastle = false;
    }
  } else {
    if (start.x == 0 && start.y == 7) { // 킹사이드 캐슬 불가능
      OURCHESS.kingSideCastle = false;
    } else if (start.x == 7 && start.y == 7) { // 퀸사이드 캐슬 불가능
      OURCHESS.queenSideCastle = false;
    }
  }

  return true;
}

function verticalCheck(start, end) {
  if (start.y < end.y) { // 위에서 밑으로
    for (var j = start.y + 1; j < end.y; j++) {
      if (!getPosition({ x: start.x, y: j }).isEmpty) {
        return false;
      }
    }
  } else if (start.y > end.y) { // 밑에서 위로
    for (var j = end.y + 1; j < start.y; j++) {
      if (!getPosition({ x: start.x, y: j }).isEmpty) {
        return false;
      }
    }
  }

  if (OURCHESS.myColor == 'W') {
    if (start.x == 0 && start.y == 7) { // 퀸사이드 캐슬 불가능
      OURCHESS.queenSideCastle = false;
    } else if (start.x == 7 && start.y == 7) { // 킹사이드 캐슬 불가능
      OURCHESS.kingSideCastle = false;
    }
  } else {
    if (start.x == 0 && start.y == 7) { // 킹사이드 캐슬 불가능
      OURCHESS.kingSideCastle = false;
    } else if (start.x == 7 && start.y == 7) { // 퀸사이드 캐슬 불가능
      OURCHESS.queenSideCastle = false;
    }
  }

  return true;
}

function castleCheck(start, end) {
  if (((start.x == 4 && end.x == 2 && OURCHESS.myColor == 'W') || (start.x == 3 && end.x == 5 && OURCHESS.myColor == 'B')) && OURCHESS.queenSideCastle) { // 퀸사이드
    for (var i = OURCHESS.myColor == 'W' ? 1 : 6; OURCHESS.myColor == 'W' ? i < start.x : i > start.x; OURCHESS.myColor == 'W' ? i++ : i--) {
      if (!getPosition({ x: i, y: start.y }).isEmpty) {
        return false;
      }
    }

    for (var i = OURCHESS.myColor == 'W' ? 2 : 5; OURCHESS.myColor == 'W' ? i < start.x : i > start.x; OURCHESS.myColor == 'W' ? i++ : i--) {
      var previewPosition = $.extend(true, [], OURCHESS.piecePosition);
      setPosition(previewPosition, OURCHESS.dragObj.point, { x: i, y: start.y }, OURCHESS.dragObj.piece);

      if (isDengerousOrSafe(previewPosition, findMyKing(previewPosition)).bool) {
        return false;
      }
    }

    OURCHESS.queenSideCastle = false;

    var oldRook = { x: OURCHESS.myColor == 'W' ? 0 : 7, y: 7 };
    var newRook = { x: OURCHESS.myColor == 'W' ? 3 : 4, y: 7 };

    drawSquare(OURCHESS.context, oldRook.x, oldRook.y);
    drawPieceX(OURCHESS.context, OURCHESS.myColor + 'R', newRook.x, newRook.y);
    setPosition(OURCHESS.piecePosition, oldRook, newRook, OURCHESS.myColor + 'R');

    socket.emit('castle', {
      myColor: OURCHESS.myColor,
      oldRook: oldRook,
      newRook: newRook
    });
  } else if (((start.x == 4 && end.x == 6 && OURCHESS.myColor == 'W') || (start.x == 3 && end.x == 1 && OURCHESS.myColor == 'B')) && OURCHESS.kingSideCastle) { // 킹사이드
    for (var i = OURCHESS.myColor == 'B' ? 1 : 6; OURCHESS.myColor == 'B' ? i < start.x : i > start.x; OURCHESS.myColor == 'B' ? i++ : i--) {
      if (!getPosition({ x: i, y: start.y }).isEmpty) {
        return false;
      }

      var previewPosition = $.extend(true, [], OURCHESS.piecePosition);
      setPosition(previewPosition, OURCHESS.dragObj.point, { x: i, y: start.y }, OURCHESS.dragObj.piece);

      if (isDengerousOrSafe(previewPosition, findMyKing(previewPosition)).bool) {
        return false;
      }
    }

    OURCHESS.kingSideCastle = false;

    var oldRook = { x: OURCHESS.myColor == 'W' ? 7 : 0, y: 7 };
    var newRook = { x: OURCHESS.myColor == 'W' ? 5 : 2, y: 7 };

    drawSquare(OURCHESS.context, oldRook.x, oldRook.y);
    drawPieceX(OURCHESS.context, OURCHESS.myColor + 'R', newRook.x, newRook.y);
    setPosition(OURCHESS.piecePosition, oldRook, newRook, OURCHESS.myColor + 'R');

    socket.emit('castle', {
      myColor: OURCHESS.myColor,
      oldRook: oldRook,
      newRook: newRook
    });
  }
  return true;
}

function isDengerousOrSafe(position, target, checkSafe, notThis) {
  // checkSafe에 true값이 전달되어 오면 이 함수의 목적이 '수비할 수 있는 블록인지 검사' 하는 것이 되고,
  // 아무 값도 전달되지 않으면 함수의 목적이 '공격당하는 블록인지 검사' 하는 것이 된다. 

  checkSafe = checkSafe || false;
  notThis = notThis || [{ x: NaN, y: NaN }];

  // 이미 검사한 기물인지 체크하는 함수
  function isAlreadyCheck(x, y) { for (var i = 0, max = notThis.length; i < max; i++) { if (notThis[i].x == x && notThis[i].y == y) return true; } return false; }

  if (checkSafe === true) {
    var enemyColor = OURCHESS.myColor;
    var myColor = OURCHESS.enemyColor;
  } else {
    var enemyColor = OURCHESS.enemyColor;
    var myColor = OURCHESS.myColor;
  }

  // 폰의 공격에 대한 검사
  function aboutPawn(x, y) { try { return position[y][x] == enemyColor + 'P' ? true : false; } catch (e) { } }

  // 한 방향으로만 공격 가능한 폰의 경우, 공격 받는지 검사할 때와 수비 가능한지 검사할 때 다른 코드를 써야한다.
  if (checkSafe === true) {
    try { // 타겟 블록에 적 기물이 있고, 타겟 블록의 왼쪽 아래에 폰이 있을 때 
      if (aboutPawn(target.x - 1, target.y + 1) && position[target.y][target.x].charAt(0) == myColor && !isAlreadyCheck(target.x - 1, target.y + 1)) {
        return { bool: true, attacker: { x: target.x - 1, y: target.y + 1 }, alreadyCheckArray: notThis, reason: '1' };
      }
    } catch (e) { }

    try { // 타겟 블록에 적 기물이 있고, 타겟 블록의 오른쪽 아래에 폰이 있을 때
      if (aboutPawn(target.x + 1, target.y + 1) && position[target.y][target.x].charAt(0) == myColor && !isAlreadyCheck(target.x + 1, target.y + 1)) {
        return { bool: true, attacker: { x: target.x + 1, y: target.y + 1 }, alreadyCheckArray: notThis, reason: '2' };
      }
    } catch (e) { }

    try { // 타겟 블록이 비어있고, 타겟 블록의 한 칸 아래에 폰이 있을 때
      if (aboutPawn(target.x, target.y + 1) && position[target.y][target.x] == '' && !isAlreadyCheck(target.x, target.y + 1)) {
        return { bool: true, attacker: { x: target.x, y: target.y + 1 }, alreadyCheckArray: notThis, reason: '3' };
      }
    } catch (e) { }

    try { // 타겟 블록이 비어있고, 타겟 블록의 두 칸 아래에 폰이 있을 때, 그리고 해당 폰이 이전에 움직인 적이 없을 때
      if (aboutPawn(target.x, target.y + 2) && position[target.y][target.x] == '' && position[target.y + 1][target.x] == '' && target.y + 2 == 6 && !isAlreadyCheck(target.x, target.y + 2)) {
        return { bool: true, attacker: { x: target.x, y: target.y + 2 }, alreadyCheckArray: notThis, reason: '4' };
      }
    } catch (e) { }
  } else {
    if (aboutPawn(target.x - 1, target.y - 1) && !isAlreadyCheck(target.x - 1, target.y - 1)) {
      return { bool: true, attacker: { x: target.x - 1, y: target.y - 1 }, alreadyCheckArray: notThis, reason: '5' };
    }
    if (aboutPawn(target.x + 1, target.y - 1) && !isAlreadyCheck(target.x + 1, target.y - 1)) {
      return { bool: true, attacker: { x: target.x + 1, y: target.y - 1 }, alreadyCheckArray: notThis, reason: '6' };
    }
  }

  // 나이트의 공격에 대한 검사
  function aboutKnight(x, y) { try { return position[y][x] == enemyColor + 'N' ? true : false; } catch (e) { } }

  for (var i = target.x - 2; i <= target.x + 2; i == target.x - 1 ? i += 2 : i++) {
    for (var j = target.y - 2; j <= target.y + 2; j == target.y - 1 ? j += 2 : j++) {
      if ((Math.abs(target.x - i) != Math.abs(target.y - j)) && aboutKnight(i, j) && !isAlreadyCheck(i, j)) {
        return { bool: true, attacker: { x: i, y: j }, alreadyCheckArray: notThis, reason: '7' };
      }
    }
  }

  // 킹의 공격에 대한 검사
  function aboutKing(x, y) { try { return position[y][x] == enemyColor + 'K' ? true : false; } catch (e) { } }

  for (var i = target.x - 1; i <= target.x + 1; i++) {
    for (var j = target.y - 1; j <= target.y + 1; j++) {
      if ((!(i == target.x && j == target.y)) && aboutKing(i, j) && !isAlreadyCheck(i, j)) {
        return { bool: true, attacker: { x: i, y: j }, alreadyCheckArray: notThis, reason: '8' };
      }
    }
  }

  // 룩과 퀸의 수직 공격에 대한 검사
  function isRookOrQueen(piece) { return piece == 'R' || piece == 'Q' }
  function isBishopOrKnightOrPawnOrKing(piece) { return piece == 'B' || piece == 'N' || piece == 'P' || piece == 'K' }

  // 위쪽
  for (var j = target.y - 1; j >= 0 && position[j][target.x].charAt(0) != myColor; j--) {
    if (isRookOrQueen(position[j][target.x].charAt(1)) && !isAlreadyCheck(target.x, j)) {
      return { bool: true, attacker: { x: target.x, y: j }, alreadyCheckArray: notThis, reason: '9' };
    } else if (isBishopOrKnightOrPawnOrKing(position[j][target.x].charAt(1))) {
      break;
    }
  }

  // 아래쪽
  for (var j = target.y + 1; j <= 7 && position[j][target.x].charAt(0) != myColor; j++) {
    if (isRookOrQueen(position[j][target.x].charAt(1)) && !isAlreadyCheck(target.x, j)) {
      return { bool: true, attacker: { x: target.x, y: j }, alreadyCheckArray: notThis, reason: '10' };
    } else if (isBishopOrKnightOrPawnOrKing(position[j][target.x].charAt(1))) {
      break;
    }
  }

  // 왼쪽
  for (var i = target.x - 1; i >= 0 && position[target.y][i].charAt(0) != myColor; i--) {
    if (isRookOrQueen(position[target.y][i].charAt(1)) && !isAlreadyCheck(i, target.y)) {
      return { bool: true, attacker: { x: i, y: target.y }, alreadyCheckArray: notThis, reason: '11' };
    } else if (isBishopOrKnightOrPawnOrKing(position[target.y][i].charAt(1))) {
      break;
    }
  }

  // 오른쪽
  for (var i = target.x + 1; i <= 7 && position[target.y][i].charAt(0) != myColor; i++) {
    if (isRookOrQueen(position[target.y][i].charAt(1)) && !isAlreadyCheck(i, target.y)) {
      return { bool: true, attacker: { x: i, y: target.y }, alreadyCheckArray: notThis, reason: '12' };
    } else if (isBishopOrKnightOrPawnOrKing(position[target.y][i].charAt(1))) {
      break;
    }
  }

  // 비숍과 퀸의 공격에 대한 검사
  function isBishopOrQueen(piece) { return piece == 'B' || piece == 'Q'; }
  function isRookOrKnightOrPawnOrKing(piece) { return piece == 'R' || piece == 'N' || piece == 'P' || piece == 'K' }

  // 왼쪽 위
  for (var i = target.x - 1, j = target.y - 1; i >= 0 && j >= 0 && position[j][i].charAt(0) != myColor; i--, j--) {
    if (isBishopOrQueen(position[j][i].charAt(1)) && !isAlreadyCheck(i, j)) {
      return { bool: true, attacker: { x: i, y: j }, alreadyCheckArray: notThis, reason: '13' };
    } else if (isRookOrKnightOrPawnOrKing(position[j][i].charAt(1))) {
      break;
    }
  }

  // 오른쪽 위
  for (var i = target.x + 1, j = target.y - 1; i <= 7 && j >= 0 && position[j][i].charAt(0) != myColor; i++, j--) {
    if (isBishopOrQueen(position[j][i].charAt(1)) && !isAlreadyCheck(i, j)) {
      return { bool: true, attacker: { x: i, y: j }, alreadyCheckArray: notThis, reason: '14' };
    } else if (isRookOrKnightOrPawnOrKing(position[j][i].charAt(1))) {
      break;
    }
  }

  // 좌측 하단 대각선
  for (var i = target.x - 1, j = target.y + 1; i >= 0 && j <= 7 && position[j][i].charAt(0) != myColor; i--, j++) {
    if (isBishopOrQueen(position[j][i].charAt(1)) && !isAlreadyCheck(i, j)) {
      return { bool: true, attacker: { x: i, y: j }, alreadyCheckArray: notThis, reason: '15' };
    } else if (isRookOrKnightOrPawnOrKing(position[j][i].charAt(1))) {
      break;
    }
  }

  // 우측 하단 대각선
  for (var i = target.x + 1, j = target.y + 1; i <= 7 && j <= 7 && position[j][i].charAt(0) != myColor; i++, j++) {
    if (isBishopOrQueen(position[j][i].charAt(1)) && !isAlreadyCheck(i, j)) {
      return { bool: true, attacker: { x: i, y: j }, alreadyCheckArray: notThis, reason: '16' };
    } else if (isRookOrKnightOrPawnOrKing(position[j][i].charAt(1))) {
      break;
    }
  }

  return { bool: false };
}

function isEnPassant(nowPosition, oldPosition, pawn, end, enemyPawn) {
  if (nowPosition[pawn.y][end.x] == enemyPawn && oldPosition[pawn.y][end.x] == '' && oldPosition[pawn.y - 2][end.x] == enemyPawn && nowPosition[pawn.y - 2][end.x] == '') {
    return true;
  } else {
    return false;
  }
}

function isCheckmate(position, king, attacker) {
  // 킹이 도망갈 곳이 있는지 검사
  function isAbleToMoveTheKing(x, y) {
    try {
      if (position[y][x].charAt(0) != OURCHESS.myColor) {
        var previewPosition = $.extend(true, [], position);
        setPosition(previewPosition, king, { x: x, y: y }, position[y][x]);

        return !isDengerousOrSafe(previewPosition, { x: x, y: y }).bool;
      } else { return false; }
    } catch (e) { }
  }

  for (var i = king.x - 1; i <= king.x + 1; i++) {
    for (var j = king.y - 1; j <= king.y + 1; j++) {
      if ((!(i == king.x && j == king.y)) && isAbleToMoveTheKing(i, j)) {
        return { bool: false, reason: '1' };
      }
    }
  }

  // 나이트에게 공격 받는지 검사
  // 나이트에게 공격 받는 경우 나이트를 처치할 수 없으면 체크메이트이다.
  if ((Math.abs(attacker.x - king.x) == 2 && Math.abs(attacker.y - king.y) == 1) || (Math.abs(attacker.x - king.x) == 1 && Math.abs(attacker.y - king.y) == 2)) {
    var isSafe = isDengerousOrSafe(position, { x: attacker.x, y: attacker.y }, true); // 나이트를 처치할 수 있는가?
    while (isSafe.bool) { // 있다면
      var previewPosition = $.extend(true, [], position);
      setPosition(previewPosition, isSafe.attacker, { x: attacker.x, y: attacker.y }, position[isSafe.attacker.y][isSafe.attacker.x]); // 기물을 움직여 나이트를 처치했을 때

      if (!isDengerousOrSafe(previewPosition, findMyKing(previewPosition)).bool) { // 킹이 안전하다면 체크메이트가 아니다.
        return { bool: false, reason: '2' };
      } else { // 안전하지 않다면 다른 기물로 다시 시도한다.
        isSafe.alreadyCheckArray.push(isSafe.attacker);
        isSafe = isDengerousOrSafe(position, { x: attacker.x, y: attacker.y }, true, isSafe.alreadyCheckArray);
      }
    }
    return { bool: true, reason: '3' }; // 더 이상 막을 기물이 없다면 체크메이트이다.
  }

  // 룩과 퀸에게 공격 받는지 검사
  if (attacker.x == king.x) { // 수직
    for (var j = attacker.y; attacker.y < king.y ? j < king.y : j > king.y; attacker.y < king.y ? j++ : j--) { // 킹과 공격자 사이의 블록들이 수비 가능한 블록인지 체크
      var isSafe = isDengerousOrSafe(position, { x: attacker.x, y: j }, true);
      while (isSafe.bool) { // 수비 가능한 블록이 있다면
        var previewPosition = $.extend(true, [], position);
        setPosition(previewPosition, isSafe.attacker, { x: attacker.x, y: j }, position[isSafe.attacker.y][isSafe.attacker.x]); // 어떤 기물을 여기로 움직여 수비 했을 때

        if (!isDengerousOrSafe(previewPosition, findMyKing(previewPosition)).bool) { // 킹이 안전하다면 체크메이트가 아니다.
          return { bool: false, reason: '4' };
        } else { // 킹이 안전하지 않다면, 다른 기물을 움직일 수 있는지 찾아본다.
          isSafe.alreadyCheckArray.push(isSafe.attacker);
          isSafe = isDengerousOrSafe(position, { x: attacker.x, y: j }, true, isSafe.alreadyCheckArray);
        }
      } // 해당 블록은 어떤 방법으로도 수비할 수 없을 경우, 다음 블록으로 넘어간다.
    }
    return { bool: true, reason: '5' }; // 어떤 블록도 수비할 수 없을 경우 체크메이트이다.
  }

  if (attacker.y == king.y) { // 수평
    for (var i = attacker.x; attacker.x < king.x ? i < king.x : i > king.x; attacker.x < king.x ? i++ : i--) {
      var isSafe = isDengerousOrSafe(position, { x: i, y: attacker.y }, true);
      while (isSafe.bool) {
        var previewPosition = $.extend(true, [], position);
        setPosition(previewPosition, isSafe.attacker, { x: i, y: attacker.y }, previewPosition[isSafe.attacker.y][isSafe.attacker.x]);

        if (!isDengerousOrSafe(previewPosition, findMyKing(previewPosition)).bool) {
          return { bool: false, reason: '6' };
        } else {
          isSafe.alreadyCheckArray.push(isSafe.attacker);
          isSafe = isDengerousOrSafe(position, { x: i, y: attacker.y }, true, isSafe.alreadyCheckArray);
        }
      }
    }
    return { bool: true, reason: '7' };
  }

  if ((attacker.x < king.x && attacker.y < king.y) || (attacker.x > king.x && attacker.y > king.y)) { // 왼쪽 위, 오른쪽 아래 대각선
    for (var i = attacker.x, j = attacker.y; (attacker.x < king.x ? i < king.x : i > king.x) && (attacker.y < king.y ? j < king.y : j > king.y) ; attacker.x < king.x ? i++ : i--, attacker.y < king.y ? j++ : j--) {
      var isSafe = isDengerousOrSafe(position, { x: i, y: j }, true);
      if (isSafe.bool) {
        var previewPosition = $.extend(true, [], position);
        setPosition(previewPosition, isSafe.attacker, { x: i, y: j }, previewPosition[isSafe.attacker.y][isSafe.attacker.x]);

        if (!isDengerousOrSafe(previewPosition, findMyKing(previewPosition)).bool) {
          return { bool: false, reason: '8' };
        } else {
          isSafe.alreadyCheckArray.push(isSafe.attacker);
          isSafe = isDengerousOrSafe(position, { x: i, y: j }, true, isSafe.alreadyCheckArray);
        }
      }
    }
    return { bool: true, reason: '9' };
  }

  if ((attacker.x > king.x && attacker.y < king.y) || (attacker.x < king.x && attacker.y > king.y)) { // 왼쪽 아래, 오른쪽 위 대각선
    for (var i = attacker.x, j = attacker.y; (attacker.x < king.x ? i < king.x : i > king.x) && (attacker.y < king.y ? j < king.y : j > king.y) ; attacker.x < king.x ? i++ : i--, attacker.y < king.y ? j++ : j--) {
      var isSafe = isDengerousOrSafe(position, { x: i, y: j }, true);
      if (isSafe.bool) {
        var previewPosition = $.extend(true, [], position);
        setPosition(previewPosition, isSafe.attacker, { x: i, y: j }, previewPosition[isSafe.attacker.y][isSafe.attacker.x]);

        if (!isDengerousOrSafe(previewPosition, findMyKing(previewPosition)).bool) {
          return { bool: false, reason: '10' };
        } else {
          isSafe.alreadyCheckArray.push(isSafe.attacker);
          isSafe = isDengerousOrSafe(position, { x: i, y: j }, true, isSafe.alreadyCheckArray);
        }
      }
    }
    return { bool: true, reason: '11' };
  }

  return { bool: false };
}

function isDraw(position) {
  if (isStalemate(position)) {
    return { bool: true, reason: 'Stalemate' };
  }

  if (isThreefoldRepetition()) {
    return { bool: true, reason: 'Threefold Repetition' };
  }

  if (isKingVsKing(position)) {
    return { bool: true, reason: 'king versus king' };
  }

  if (isKingAndBishopVsKingOrKingAndKnightpVsKing(position, 'B')) {
    return { bool: true, reason: 'king and bishop versus king' };
  }

  if (isKingAndBishopVsKingOrKingAndKnightpVsKing(position, 'N')) {
    return { bool: true, reason: 'king and knight versus king' };
  }

  return false;
}

function isThreefoldRepetition() {
  for (var i = 0, max = OURCHESS.recordingPosition.length; i < max; i++) {
    if (OURCHESS.recordingPosition[i].repetition >= 3) {
      return true;
    }
  }

  return false;
}

function isKingVsKing(position) {
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      if (position[i][j] != '' && position[i][j].charAt(1) != 'K') {
        return false;
      }
    }
  }

  return true;
}

function isKingAndBishopVsKingOrKingAndKnightpVsKing(position, piece) {
  var bishopOrKnightCount = 0;
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      if (position[i][j] != '' && position[i][j].charAt(1) == piece) {
        bishopOrKnightCount++;
      } else if (position[i][j] != '' && position[i][j].charAt(1) != piece && position[i][j].charAt(1) != 'K') {
        return false;
      }
    }
  }

  if (bishopOrKnightCount == 1) {
    return true;
  } else {
    return false;
  }
}

function isStalemate(position) {
  function isAbleToMoveSomeone(_x, _y) {
    try {
      if (position[_y][_x].charAt(0) != OURCHESS.myColor) {
        var previewPosition = $.extend(true, [], position);
        setPosition(previewPosition, { x: x, y: y }, { x: _x, y: _y }, position[y][x]);
        if (!isDengerousOrSafe(previewPosition, findMyKing(previewPosition)).bool) { return false; }
      }
    } catch (e) { }
  }

  function aboutPawn(x, y) {
    try {
      if (position[y - 1][x] == '' && position[y - 2][x] == '' && isAbleToMoveSomeone(x, y - 2) === false) { return false; }
    } catch (e) { }

    try {
      if (position[y - 1][x] == '' && isAbleToMoveSomeone(x, y - 1) === false) { return false; }
    } catch (e) { }

    try {
      if (position[y - 1][x - 1].charAt(0) == OURCHESS.enemyColor && isAbleToMoveSomeone(x - 1, y - 1) === false) { return false; }
    } catch (e) { }

    try {
      if (position[y - 1][x + 1].charAt(0) == OURCHESS.enemyColor && isAbleToMoveSomeone(x + 1, y - 1) === false) { return false; }
    } catch (e) { }

    try {
      if (isEnPassant(position, OURCHESS.oldPiecePosition, piece, { x: x - 1, y: y - 1 }, enemyColor + 'P') && isAbleToMoveSomeone(x - 1, y - 1) === false) { return false; }
    } catch (e) { }

    try {
      if (isEnPassant(position, OURCHESS.oldPiecePosition, piece, { x: x + 1, y: y - 1 }, enemyColor + 'P') && isAbleToMoveSomeone(x + 1, y - 1) === false) { return false; }
    } catch (e) { }
  }

  function aboutBishop(x, y) {
    for (var i = x - 1, j = y - 1; i >= 0 && j >= 0; i--, j--) {
      if (isAbleToMoveSomeone(i, j) === false) { return false; }
    }

    for (var i = x + 1, j = y - 1; i <= 7 && j >= 0; i++, j--) {
      if (isAbleToMoveSomeone(i, j) === false) { return false; }
    }

    for (var i = x - 1, j = y + 1; i >= 0 && j <= 7; i--, j++) {
      if (isAbleToMoveSomeone(i, j) === false) { return false; }
    }

    for (var i = x + 1, j = y + 1; i <= 7 && j <= 7; i++, j++) {
      if (isAbleToMoveSomeone(i, j) === false) { return false; }
    }
  }

  function aboutKnight(x, y) {
    for (var i = x - 2; i <= x + 2; i == x - 1 ? i += 2 : i++) {
      for (var j = y - 2; j <= y + 2; j == y - 1 ? j += 2 : j++) {
        if ((Math.abs(x - i) != Math.abs(y - j)) && isAbleToMoveSomeone(i, j) === false) { return false; }
      }
    }
  }

  function aboutRook(x, y) {
    for (var j = y - 1; j >= 0; j--) {
      if (isAbleToMoveSomeone(x, j) === false) { return false; }
    }

    for (var j = y + 1; j <= 7; j++) {
      if (isAbleToMoveSomeone(x, j) === false) { return false; }
    }

    for (var i = x - 1; i >= 0; i--) {
      if (isAbleToMoveSomeone(i, y) === false) { return false; }
    }

    for (var i = x + 1; i <= 7; i++) {
      if (isAbleToMoveSomeone(i, y) === false) { return false; }
    }
  }

  function aboutQueen(x, y) {
    for (var i = x - 1, j = y - 1; i >= 0 && j >= 0; i--, j--) {
      if (isAbleToMoveSomeone(i, j) === false) { return false; }
    }
    for (var i = x + 1, j = y - 1; i <= 7 && j >= 0; i++, j--) {
      if (isAbleToMoveSomeone(i, j) === false) { return false; }
    }

    for (var i = x - 1, j = y + 1; i >= 0 && j <= 7; i--, j++) {
      if (isAbleToMoveSomeone(i, j) === false) { return false; }
    }

    for (var i = x + 1, j = y + 1; i <= 7 && j <= 7; i++, j++) {
      if (isAbleToMoveSomeone(i, j) === false) { return false; }
    }

    for (var j = y - 1; j >= 0; j--) {
      if (isAbleToMoveSomeone(x, j) === false) { return false; }
    }

    for (var j = y + 1; j <= 7; j++) {
      if (isAbleToMoveSomeone(x, j) === false) { return false; }
    }

    for (var i = x - 1; i >= 0; i--) {
      if (isAbleToMoveSomeone(i, y) === false) { return false; }
    }

    for (var i = x + 1; i <= 7; i++) {
      if (isAbleToMoveSomeone(i, y) === false) { return false; }
    }
  }

  function aboutKing(x, y) {
    for (var i = x - 1; i <= x + 1; i++) {
      for (var j = y - 1; j <= y + 1; j++) {
        if (!(i == x && j == y) && isAbleToMoveSomeone(i, j) === false) { return false; }
      }
    }
  }

  for (var y = 0; y < 8; y++) {
    for (var x = 0; x < 8; x++) {
      if (position[y][x].charAt(0) == OURCHESS.myColor) {
        switch (position[y][x].charAt(1)) {
          case 'P':
            if (aboutPawn(x, y) === false) return false;
            break;
          case 'B':
            if (aboutBishop(x, y) === false) return false;
            break;
          case 'K':
            if (aboutKnight(x, y) === false) return false;
            break;
          case 'R':
            if (aboutRook(x, y) === false) return false;
            break;
          case 'Q':
            if (aboutQueen(x, y) === false) return false;
            break;
          case 'K':
            if (aboutKing(x, y) === false) return false;
            break;
        }
      }
    }
  }
  return true;
}