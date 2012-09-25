function isDragPossible(event) {
    var nowPoint = getPointXY(event);
    var nowObj = getPosition(nowPoint);

    if (!isInBoard(nowPoint)) {
        return false;
    }

    if (movePermission == false) {
        return false;
    }

    if (nowObj.piece.charAt(0) != myColor) {
        return false;
    }

    if (nowObj.piece == '') {
        return false;
    }

    return [nowPoint, nowObj];
}

function isDropPossible(event) {
    var nowPoint = getPointXY(event);
    var nowObj = getPosition(nowPoint);

    if (!isInBoard(nowPoint)) {
        return false;
    }

    if (dragObj.piece.charAt(0) == nowObj.piece.charAt(0)) {
        return false;
    }

    if (!isRightRule(dragObj.piece.charAt(1), nowPoint)) {
        return false;
    }

    var previewPosition = $.extend(true, [], piecePosition);
    setPosition(previewPosition, dragObj.p, getPosition(nowPoint).p, dragObj.piece);

    if (itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
        return false;
    }

    return nowPoint;
}

function isInBoard(p) {
    if (p.x >= 0 && p.x < 8 && p.y >= 0 && p.y < 8) {
        return true;
    } else {
        return false;
    }
}

function isRightRule(piece, endP) {
    var result = true;
    var pointArgs = {
        start: { x: dragObj.p.x, y: dragObj.p.y },
        end: { x: Math.floor(endP.x), y: Math.floor(endP.y) }
    }

    switch (piece) {
        case 'P':
            result = pawnRule(pointArgs);
            break;
        case 'R':
            result = rookRule(pointArgs);
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
                kingSideCastle = false;
                queenSideCastle = false;
                castle = false;
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
                    dragObj.piece = myColor + 'Q';
                }
                return true;
            }
        } else {
            return false;
        }
    } else if (Math.abs(p.start.x - p.end.x) == 1 && p.start.y - p.end.y == 1) { // 대각선 1칸 캡처
        if (!getPosition(p.end).isEmpty) {
            if (p.end.y == 0) { // 프로모션
                dragObj.piece = myColor + 'Q';
            }
            return true;
        } else { // 대각선 1칸 이동이지만 해당 위치가 빈 블록일 때
            if (isEnPassant(piecePosition, oldPiecePosition, p.start, p.end, (myColor == 'W' ? 'B' : 'W') + 'P')) { // 앙파상일 때
                piecePosition[p.start.y][p.end.x] = '';
                drawSquare(context, p.end.x, p.start.y);
                socket.emit('enPassant', { x: p.end.x, y: p.start.y, myColor: myColor });
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
    } else if (p.start.y == p.end.y && Math.abs(p.start.x - p.end.x) == 2 && castle && !check) { // 캐슬
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

    if (myColor == 'W') {
        if (start.x == 0 && start.y == 7) { // 퀸사이드 캐슬 불가능
            queenSideCastle = false;
        } else if (start.x == 7 && start.y == 7) { // 킹사이드 캐슬 불가능
            kingSideCastle = false;
        }
    } else {
        if (start.x == 0 && start.y == 7) { // 킹사이드 캐슬 불가능
            kingSideCastle = false;
        } else if (start.x == 7 && start.y == 7) { // 퀸사이드 캐슬 불가능
            queenSideCastle = false;
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

    if (myColor == 'W') {
        if (start.x == 0 && start.y == 7) { // 퀸사이드 캐슬 불가능
            queenSideCastle = false;
        } else if (start.x == 7 && start.y == 7) { // 킹사이드 캐슬 불가능
            kingSideCastle = false;
        }
    } else {
        if (start.x == 0 && start.y == 7) { // 킹사이드 캐슬 불가능
            kingSideCastle = false;
        } else if (start.x == 7 && start.y == 7) { // 퀸사이드 캐슬 불가능
            queenSideCastle = false;
        }
    }

    return true;
}

function castleCheck(start, end) {
    if (((start.x == 4 && end.x == 2 && myColor == 'W') || (start.x == 3 && end.x == 5 && myColor == 'B')) && queenSideCastle) { // 퀸사이드
        for (var i = myColor == 'W' ? 1 : 6; myColor == 'W' ? i < start.x : i > start.x; myColor == 'W' ? i++ : i--) {
            if (!getPosition({ x: i, y: start.y }).isEmpty) {
                return false;
            }
        }

        for (var i = myColor == 'W' ? 2 : 5; myColor == 'W' ? i < start.x : i > start.x; myColor == 'W' ? i++ : i--) {
            var previewPosition = $.extend(true, [], piecePosition);
            setPosition(previewPosition, dragObj.p, { x: i, y: start.y }, dragObj.piece);

            if (itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                return false;
            }
        }

        queenSideCastle = false;

        var oldRook = { x: myColor == 'W' ? 0 : 7, y: 7 };
        var newRook = { x: myColor == 'W' ? 3 : 4, y: 7 };

        drawSquare(context, oldRook.x, oldRook.y);
        drawPieceX(context, myColor + 'R', newRook.x, newRook.y);
        setPosition(piecePosition, oldRook, newRook, myColor + 'R');

        socket.emit('castle', {
            myColor: myColor,
            oldRook: oldRook,
            newRook: newRook
        });
    } else if (((start.x == 4 && end.x == 6 && myColor == 'W') || (start.x == 3 && end.x == 1 && myColor == 'B')) && kingSideCastle) { // 킹사이드
        for (var i = myColor == 'B' ? 1 : 6; myColor == 'B' ? i < start.x : i > start.x; myColor == 'B' ? i++ : i--) {
            if (!getPosition({ x: i, y: start.y }).isEmpty) {
                return false;
            }

            var previewPosition = $.extend(true, [], piecePosition);
            setPosition(previewPosition, dragObj.p, { x: i, y: start.y }, dragObj.piece);

            if (itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                return false;
            }
        }

        kingSideCastle = false;

        var oldRook = { x: myColor == 'W' ? 7 : 0, y: 7 };
        var newRook = { x: myColor == 'W' ? 5 : 2, y: 7 };

        drawSquare(context, oldRook.x, oldRook.y);
        drawPieceX(context, myColor + 'R', newRook.x, newRook.y);
        setPosition(piecePosition, oldRook, newRook, myColor + 'R');

        socket.emit('castle', {
            myColor: myColor,
            oldRook: oldRook,
            newRook: newRook
        });
    }
    return true;
}

function itCanBeAttackedOrDepended(position, target, isDepended) {
    var ret = { bool: true, attacker: {} };

    // isDepended에 true값이 전달되어 오면 이 함수의 목적이 '수비할 수 있는 블록인지 검사' 하는 것이 되고,
    // 아무 값도 전달되지 않으면 함수의 목적이 '공격당하는 블록인지 검사' 하는 것이 된다. 

    if (isDepended) {
        var enemyColor = this.myColor;
        var myColor = this.enemyColor;
    } else {
        var enemyColor = this.enemyColor;
        var myColor = this.myColor;
    }

    if (isDepended) {
        try {
            if (position[target.y + 1][target.x - 1] == (enemyColor + 'P')) { // 폰의 공격을 받는 위치일 때
                ret.attacker = { x: target.x - 1, y: target.y + 1 };
                return ret;
            }
        } catch (e) { }
    } else {
        try {
            if (position[target.y - 1][target.x - 1] == (enemyColor + 'P')) { // 폰의 공격을 받는 위치일 때
                ret.attacker = { x: target.x - 1, y: target.y - 1 };
                return ret;
            }
        } catch (e) { }
    }

    if (isDepended) {
        try {
            if (position[target.y + 1][target.x + 1] == (enemyColor + 'P')) { // 폰의 공격을 받는 위치일 때
                ret.attacker = { x: target.x + 1, y: target.y + 1 };
                return ret;
            }
        } catch (e) { }
    } else {
        try {
            if (position[target.y - 1][target.x + 1] == (enemyColor + 'P')) { // 폰의 공격을 받는 위치일 때
                ret.attacker = { x: target.x + 1, y: target.y - 1 };
                return ret;
            }
        } catch (e) { }
    }

    try {
        if (position[target.y - 1][target.x - 2] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            ret.attacker = { x: target.x - 2, y: target.y - 1 };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y + 1][target.x - 2] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            ret.attacker = { x: 111111, y: 111111 };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y - 2][target.x - 1] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            ret.attacker = { x: target.x - 1, y: target.y - 2 };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y + 2][target.x - 1] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            ret.attacker = { x: target.x - 1, y: target.y + 2 };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y - 2][target.x + 1] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            ret.attacker = { x: target.x + 1, y: target.y - 2 };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y + 2][target.x + 1] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            ret.attacker = { x: target.x + 1, y: target.y + 2 };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y - 1][target.x + 2] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            ret.attacker = { x: target.x + 2, y: target.y - 1 };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y + 1][target.x + 2] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            ret.attacker = { x: target.x + 2, y: target.y + 1 };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y - 1][target.x - 1] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            ret.attacker = { x: target.x - 1, y: target.y - 1 };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y][target.x - 1] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            ret.attacker = { x: target.x - 1, y: target.y };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y + 1][target.x - 1] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            ret.attacker = { x: target.x - 1, y: target.y + 1 };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y - 1][target.x] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            ret.attacker = { x: target.x, y: target.y - 1 };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y + 1][target.x] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            ret.attacker = { x: target.x, y: target.y + 1 };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y - 1][target.x + 1] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            ret.attacker = { x: target.x + 1, y: target.y - 1 };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y][target.x + 1] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            ret.attacker = { x: target.x + 1, y: target.y };
            return ret;
        }
    } catch (e) { }

    try {
        if (position[target.y + 1][target.x + 1] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            ret.attacker = { x: target.x + 1, y: target.y + 1 };
            return ret;
        }
    } catch (e) { }

    // 상
    for (var j = target.y - 1; j >= 0; j--) {
        if (position[j][target.x].charAt(0) == myColor) { // 아군 기물로 막혀있으면 공격받지 않음
            break;
        } else {
            var temp = position[j][target.x].charAt(1);
            if (temp == 'B' || temp == 'K' || temp == 'N' || temp == 'P') {
                break;
            } else if (temp == 'R' || temp == 'Q') {
                ret.attacker = { x: target.x, y: j };
                return ret;
            }
        }
    }

    // 하
    for (var j = target.y + 1; j <= 7; j++) {
        if (position[j][target.x].charAt(0) == myColor) { // 아군 기물로 막혀있으면 공격받지 않음
            break;
        } else {
            var temp = position[j][target.x].charAt(1);
            if (temp == 'B' || temp == 'K' || temp == 'N' || temp == 'P') {
                break;
            } else if (temp == 'R' || temp == 'Q') {
                ret.attacker = { x: target.x, y: j };
                return ret;
            }
        }
    }

    // 좌
    for (var i = target.x - 1; i >= 0 ; i--) {
        if (position[target.y][i].charAt(0) == myColor) { // 아군 기물로 막혀있으면 공격받지 않음
            break;
        } else {
            var temp = position[target.y][i].charAt(1);
            if (temp == 'B' || temp == 'K' || temp == 'N' || temp == 'P') {
                break;
            } else if (temp == 'R' || temp == 'Q') {
                ret.attacker = { x: i, y: target.y };
                return ret;
            }
        }
    }

    // 우
    for (var i = target.x + 1; i <= 7 ; i++) {
        if (position[target.y][i].charAt(0) == myColor) { // 아군 기물로 막혀있으면 공격받지 않음
            break;
        } else {
            var temp = position[target.y][i].charAt(1);
            if (temp == 'B' || temp == 'K' || temp == 'N' || temp == 'P') {
                break;
            } else if (temp == 'R' || temp == 'Q') {
                ret.attacker = { x: i, y: target.y };
                return ret;
            }
        }
    }

    // 좌측 상단 대각선
    for (var i = target.x - 1, j = target.y - 1; i >= 0 && j >= 0; i--, j--) {
        if (position[j][i].charAt(0) == myColor) {
            break;
        } else {
            var temp = position[j][i].charAt(1);
            if (temp == 'R' || temp == 'K' || temp == 'N' || temp == 'P') {
                break;
            } else if (temp == 'B' || temp == 'Q') {
                ret.attacker = { x: i, y: j };
                return ret;
            }
        }
    }

    // 우측 상단 대각선
    for (var i = target.x + 1, j = target.y - 1; i <= 7 && j >= 0; i++, j--) {
        if (position[j][i].charAt(0) == myColor) {
            break;
        } else {
            var temp = position[j][i].charAt(1);
            if (temp == 'R' || temp == 'K' || temp == 'N' || temp == 'P') {
                break;
            } else if (temp == 'B' || temp == 'Q') {
                ret.attacker = { x: i, y: j };
                return ret;
            }
        }
    }

    // 좌측 하단 대각선
    for (var i = target.x - 1, j = target.y + 1; i >= 0 && j <= 7; i--, j++) {
        if (position[j][i].charAt(0) == myColor) {
            break;
        } else {
            var temp = position[j][i].charAt(1);
            if (temp == 'R' || temp == 'K' || temp == 'N' || temp == 'P') {
                break;
            } else if (temp == 'B' || temp == 'Q') {
                ret.attacker = { x: i, y: j };
                return ret;
            }
        }
    }

    // 우측 하단 대각선
    for (var i = target.x + 1, j = target.y + 1; i <= 7 && j <= 7; i++, j++) {
        if (position[j][i].charAt(0) == myColor) {
            break;
        } else {
            var temp = position[j][i].charAt(1);
            if (temp == 'R' || temp == 'K' || temp == 'N' || temp == 'P') {
                break;
            } else if (temp == 'B' || temp == 'Q') {
                ret.attacker = { x: i, y: j };
                return ret;
            }
        }
    }

    ret.bool = false;
    return ret;
}

function isEnPassant(nowPosition, oldPosition, pawn, end, enemyPawn) {
    if (nowPosition[pawn.y][end.x] == enemyPawn && oldPosition[pawn.y][end.x] == '' && oldPosition[pawn.y - 2][end.x] == enemyPawn && nowPosition[pawn.y - 2][end.x] == '') {
        return true;
    } else {
        return false;
    }
}

function isCheckmate(position, king, attacker) {
    var ret = { checkmate: false, stalemate: false };
    var previewPosition = $.extend(true, [], position);

    try {
        if (previewPosition[king.y - 1][king.x - 1].charAt(0) != 'W') {
            if (!itCanBeAttackedOrDepended(previewPosition, { x: king.x - 1, y: king.y - 1 }).bool) { // 킹이 도망칠 곳이 있다면 체크메이트가 아니다.
                return false;
            }
        }
    } catch (e) { }

    try {
        if (previewPosition[king.y - 1][king.x].charAt(0) != 'W') {
            if (!itCanBeAttackedOrDepended(previewPosition, { x: king.x, y: king.y - 1 }).bool) {
                return false;
            }
        }
    } catch (e) { }

    try {
        if (previewPosition[king.y - 1][king.x + 1].charAt(0) != 'W') {
            if (!itCanBeAttackedOrDepended(previewPosition, { x: king.x + 1, y: king.y - 1 }).bool) {
                return false;
            }
        }
    } catch (e) { }

    try {
        if (previewPosition[king.y][king.x - 1].charAt(0) != 'W') {
            if (!itCanBeAttackedOrDepended(previewPosition, { x: king.x - 1, y: king.y }).bool) {
                return false;
            }
        }
    } catch (e) { }

    try {
        if (previewPosition[king.y][king.x + 1].charAt(0) != 'W') {
            if (!itCanBeAttackedOrDepended(previewPosition, { x: king.x + 1, y: king.y }).bool) {
                return false;
            }
        }
    } catch (e) { }

    try {
        if (previewPosition[king.y + 1][king.x - 1].charAt(0) != 'W') {
            if (!itCanBeAttackedOrDepended(previewPosition, { x: king.x - 1, y: king.y + 1 }).bool) {
                return false;
            }
        }
    } catch (e) { }

    try {
        if (previewPosition[king.y + 1][king.x].charAt(0) != 'W') {
            if (!itCanBeAttackedOrDepended(previewPosition, { x: king.x, y: king.y + 1 }).bool) {
                return false;
            }
        }
    } catch (e) { }

    try {
        if (previewPosition[king.y + 1][king.x + 1].charAt(0) != 'W') {
            if (!itCanBeAttackedOrDepended(previewPosition, { x: king.x + 1, y: king.y + 1 }).bool) {
                return false;
            }
        }
    } catch (e) { }

    if ((Math.abs(attacker.x - king.x) == 2 && Math.abs(attacker.y - king.y) == 1) || (Math.abs(attacker.x - king.x) == 1 && Math.abs(attacker.y - king.y) == 2)) { // 나이트에게 공격 받을 때
        if (itCanBeAttackedOrDepended(previewPosition, { x: attacker.x, y: attacker.y }, true).bool) {
            return false;
        } else {
            return true;
        }
    }

    if (attacker.x == king.x) { // 수직
        for (var j = attacker.y; attacker.y < king.y ? j < king.y : j > king.y; attacker.y < king.y ? j++ : j--) { // 킹과 공격자 사이의 블록들이 수비 가능한 블록인지 체크
            var simulation = itCanBeAttackedOrDepended(previewPosition, { x: attacker.x, y: j }, true);
            if (simulation.bool) {
                var tempPosition = $.extend(true, [], previewPosition);
                setPosition(tempPosition, simulation.attacker, { x: attacker.x, y: j }, previewPosition[simulation.attacker.y][simulation.attacker.x]);

                if (itCanBeAttackedOrDepended(tempPosition, { x: king.x, y: king.y }).bool) {
                    return false;
                } else {
                    break;
                }
            }
        }

        return true;
    } else if (attacker.y == king.y) { // 수평
        for (var i = attacker.x; attacker.x < king.x ? i < king.x : i > king.x; attacker.x < king.x ? i++ : i--) { // 킹과 공격자 사이의 블록들이 수비 가능한 블록인지 체크
            var simulation = itCanBeAttackedOrDepended(previewPosition, { x: i, y: attacker.y }, true);
            if (simulation.bool) {
                var tempPosition = $.extend(true, [], previewPosition);
                setPosition(tempPosition, simulation.attacker, { x: i, y: attacker.y }, previewPosition[simulation.attacker.y][simulation.attacker.x]);

                if (itCanBeAttackedOrDepended(tempPosition, { x: king.x, y: king.y }).bool) {
                    return false;
                } else {
                    break;
                }
            }
        }

        return true;
    } else if (attacker.x < king.x && attacker.y < king.y) { // 왼쪽 위에 어태커가 있을 때
        for (var i = attacker.x, j = attacker.y; i < king.x && j < king.y; i++, j++) {
            var simulation = itCanBeAttackedOrDepended(previewPosition, { x: i, y: j }, true);
            if (simulation.bool) {
                var tempPosition = $.extend(true, [], previewPosition);
                setPosition(tempPosition, simulation.attacker, { x: i, y: j }, previewPosition[simulation.attacker.y][simulation.attacker.x]);

                if (itCanBeAttackedOrDepended(tempPosition, { x: king.x, y: king.y }).bool) {
                    return false;
                } else {
                    break;
                }
            }
        }

        return true;
    } else if (attacker.x > king.x && attacker.y < king.y) { // 오른쪽 위
        for (var i = attacker.x, j = attacker.y; i > king.x && j < king.y; i--, j++) {
            var simulation = itCanBeAttackedOrDepended(previewPosition, { x: i, y: j }, true);
            if (simulation.bool) {
                var tempPosition = $.extend(true, [], previewPosition);
                setPosition(tempPosition, simulation.attacker, { x: i, y: j }, previewPosition[simulation.attacker.y][simulation.attacker.x]);

                if (itCanBeAttackedOrDepended(tempPosition, { x: king.x, y: king.y }).bool) {
                    return false;
                } else {
                    break;
                }
            }
        }

        return true;
    } else if (attacker.x < king.x && attacker.y > king.y) { // 왼쪽 아래
        for (var i = attacker.x, j = attacker.y; i < king.x && j > king.y; i++, j--) {
            var simulation = itCanBeAttackedOrDepended(previewPosition, { x: i, y: j }, true);
            if (simulation.bool) {
                var tempPosition = $.extend(true, [], previewPosition);
                setPosition(tempPosition, simulation.attacker, { x: i, y: j }, previewPosition[simulation.attacker.y][simulation.attacker.x]);

                if (itCanBeAttackedOrDepended(tempPosition, { x: king.x, y: king.y }).bool) {
                    return false;
                } else {
                    break;
                }
            }
        }

        return true;
    } else if (attacker.x > king.x && attacker.y > king.y) { // 오른쪽 아래
        for (var i = attacker.x, j = attacker.y; i > king.x && j > king.y; i--, j--) {
            var simulation = itCanBeAttackedOrDepended(previewPosition, { x: i, y: j }, true);
            if (simulation.bool) {
                var tempPosition = $.extend(true, [], previewPosition);
                setPosition(tempPosition, simulation.attacker, { x: i, y: j }, previewPosition[simulation.attacker.y][simulation.attacker.x]);

                if (itCanBeAttackedOrDepended(tempPosition, { x: king.x, y: king.y }).bool) {
                    return false;
                } else {
                    break;
                }
            }
        }

        return true;
    } else {
        console.log('??');
    }
}

function isStalemate(position) {
    var previewPosition;

    for (var y = 0; y < 8; y++) {
        for (var x = 0; x < 8; x++) {
            var piece = position[y][x];
            if (piece.charAt(0) == myColor) {
                if (piece.charAt(1) == 'P') {
                    try {
                        if (position[y - 1][x] == '' && position[y - 2][x] == '') { // 폰의 앞 2칸이 비었을 때
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x, y: y - 2 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y - 1][x] == '') { // 폰의 앞 1칸만 비었을 때
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x, y: y - 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y - 1][x - 1].charAt(0) == enemyColor) { // 폰의 왼쪽 위 블록에 적 기물이 있을 때
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x - 1, y: y - 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y - 1][x + 1].charAt(0) == enemyColor) { // 폰의 오른쪽 위 블록에 적 기물이 있을 때
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x + 1, y: y - 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (isEnPassant(position, oldPiecePosition, piece, { x: x - 1, y: y - 1 }, enemyColor + 'P')) { // 왼쪽 앙파상일 때
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x - 1, y: y - 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (isEnPassant(position, oldPiecePosition, piece, { x: x + 1, y: y - 1 }, enemyColor + 'P')) { // 오른쪽 앙파상일 때
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x + 1, y: y - 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }
                } else if (piece.charAt(1) == 'B') {
                    for (var i = x - 1, j = y - 1; i >= 0 && j >= 0; i--, j--) { // 왼쪽 위 대각선으로 이동 가능한지 탐색
                        if (position[j][i].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: i, y: j }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }

                    for (var i = x + 1, j = y - 1; i <= 7 && j >= 0; i++, j--) { // 오른쪽 위 대각선으로 이동 가능한지 탐색
                        if (position[j][i].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: i, y: j }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }

                    for (var i = x - 1, j = y + 1; i >= 0 && j <= 7; i--, j++) { // 왼쪽 아래 대각선으로 이동 가능한지 탐색
                        if (position[j][i].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: i, y: j }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }

                    for (var i = x + 1, j = y + 1; i <= 7 && j <= 7; i++, j++) { // 오른쪽 아래 대각선으로 이동 가능한지 탐색
                        if (position[j][i].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: i, y: j }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }
                } else if (piece.charAt(1) == 'N') {
                    try {
                        if (position[y - 2][x - 1].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x - 1, y: y - 2 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y - 2][x + 1].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x + 1, y: y - 2 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y - 1][x - 2].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x - 2, y: y - 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y - 1][x + 2].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x + 2, y: y - 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y + 1][x - 2].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x - 2, y: y + 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y + 1][x + 2].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x + 2, y: y + 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y + 2][x - 1].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x - 1, y: y + 2 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y + 2][x + 1].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x + 1, y: y + 2 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }
                } else if (piece.charAt(1) == 'R') {
                    for (var j = y - 1; j >= 0; j--) { // 위쪽 탐색
                        if (position[j][x].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x, y: j }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }

                    for (var j = y + 1; j <= 7; j++) { // 아래쪽 탐색
                        if (position[j][x].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x, y: j }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }

                    for (var i = x - 1; i >= 0; i--) { // 왼쪽 탐색
                        if (position[y][i].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: i, y: y }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }

                    for (var i = x + 1; i <= 7; i++) { // 왼쪽 탐색
                        if (position[y][i].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: i, y: y }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }
                } else if (piece.charAt(1) == 'Q') {
                    for (var i = x - 1, j = y - 1; i >= 0 && j >= 0; i--, j--) { // 왼쪽 위 대각선으로 이동 가능한지 탐색
                        if (position[j][i].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: i, y: j }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }

                    for (var i = x + 1, j = y - 1; i <= 7 && j >= 0; i++, j--) { // 오른쪽 위 대각선으로 이동 가능한지 탐색
                        if (position[j][i].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: i, y: j }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }

                    for (var i = x - 1, j = y + 1; i >= 0 && j <= 7; i--, j++) { // 왼쪽 아래 대각선으로 이동 가능한지 탐색
                        if (position[j][i].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: i, y: j }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }

                    for (var i = x + 1, j = y + 1; i <= 7 && j <= 7; i++, j++) { // 오른쪽 아래 대각선으로 이동 가능한지 탐색
                        if (position[j][i].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: i, y: j }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }

                    for (var j = y - 1; j >= 0; j--) { // 위쪽 탐색
                        if (position[j][x].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x, y: j }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }

                    for (var j = y + 1; j <= 7; j++) { // 아래쪽 탐색
                        if (position[j][x].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x, y: j }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }

                    for (var i = x - 1; i >= 0; i--) { // 왼쪽 탐색
                        if (position[y][i].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: i, y: y }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }

                    for (var i = x + 1; i <= 7; i++) { // 왼쪽 탐색
                        if (position[y][i].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: i, y: y }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    }
                } else if (piece.charAt(1) == 'K') {
                    try {
                        if (position[y - 1][x - 1].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x - 1, y: y - 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y - 1][x].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x, y: y - 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y - 1][x + 1].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x + 1, y: y - 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y][x - 1].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x - 1, y: y }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y][x + 1].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x + 1, y: y }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y + 1][x - 1].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x - 1, y: y + 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y + 1][x].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x, y: y + 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }

                    try {
                        if (position[y + 1][x + 1].charAt(0) != myColor) {
                            previewPosition = $.extend(true, [], position);
                            setPosition(previewPosition, { x: x, y: y }, { x: x + 1, y: y + 1 }, piece);

                            if (!itCanBeAttackedOrDepended(previewPosition, findMyKing(previewPosition)).bool) {
                                return false;
                            }
                        }
                    } catch (e) { }
                }
            }
        }
    }
    return true;
}