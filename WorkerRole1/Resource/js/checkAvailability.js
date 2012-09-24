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

    if (isBeingAttacked(previewPosition, findMyKing(previewPosition))) {
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
            if (result) { // 한번이라도 움직일 시 캐슬 불가
                castle = false;
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
        } else {
            return false;
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
        return VerticalCheck(start, end);
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
        return true;
    } else if (start.x > end.x) { // 오른쪽에서 왼쪽으로
        for (var i = end.x + 1; i < start.x; i++) {
            if (!getPosition({ x: i, y: start.y }).isEmpty) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}

function VerticalCheck(start, end) {
    if (start.y < end.y) { // 위에서 밑으로
        for (var j = start.y + 1; j < end.y; j++) {
            if (!getPosition({ x: start.x, y: j }).isEmpty) {
                return false;
            }
        }
        return true;
    } else if (start.y > end.y) { // 밑에서 위로
        for (var j = end.y + 1; j < start.y; j++) {
            if (!getPosition({ x: start.x, y: j }).isEmpty) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}

function castleCheck(start, end) {
    if (start.x > end.x) { // 퀸사이드
        for (var i = 1; i < start.x; i++) {
            if (!getPosition({ x: i, y: start.y }).isEmpty) {
                return false;
            }

            var previewPosition = $.extend(true, [], piecePosition);
            setPosition(previewPosition, dragObj.p, { x: i, y: start.y }, dragObj.piece);

            if (isBeingAttacked(previewPosition, findMyKing(previewPosition))) {
                return false;
            }
        }
        drawSquare(context, 0, 7);
        drawPieceX(context, myColor + 'R', start.x - 1, start.y);
        setPosition(piecePosition, { x: 0, y: start.y }, { x: start.x - 1, y: start.y }, myColor + 'R');

        socket.emit('castle', {
            myColor: myColor,
            drawSquare_x: 0,
            drawSquare_y: 7,
            drawPieceX_piece: myColor + 'R',
            drawPieceRook_x: start.x - 1,
            drawPieceRook_y: start.y,
            setPosition_start_x: 0,
            setPosition_start_y: start.y,
            setPosition_end_x: start.x - 1,
            setPosition_end_y: start.y
        });
    } else { // 킹사이드
        for (var i = 6; i > start.x; i--) {
            if (!getPosition({ x: i, y: start.y }).isEmpty) {
                return false;
            }

            var previewPosition = $.extend(true, [], piecePosition);
            setPosition(previewPosition, dragObj.p, { x: i, y: start.y }, dragObj.piece);

            if (isBeingAttacked(previewPosition, findMyKing(previewPosition))) {
                return false;
            }
        }
        drawSquare(context, 7, 7);
        drawPieceX(context, myColor + 'R', start.x + 1, start.y);
        setPosition(piecePosition, { x: 7, y: start.y }, { x: start.x + 1, y: start.y }, myColor + 'R');

        socket.emit('castle', {
            myColor: myColor,
            drawSquare_x: 7,
            drawSquare_y: 7,
            drawPieceX_piece: myColor + 'R',
            drawPieceRook_x: start.x + 1,
            drawPieceRook_y: start.y,
            setPosition_start_x: 7,
            setPosition_start_y: start.y,
            setPosition_end_x: start.x + 1,
            setPosition_end_y: start.y
        });
    }
    
    return true;
}

function isBeingAttacked(position, target) {
    var enemyColor = myColor == 'W' ? 'B' : 'W';

    try {
        if (position[target.y - 1][target.x - 1] == (enemyColor + 'P')) { // 폰의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y - 1][target.x + 1] == (enemyColor + 'P')) { // 폰의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y - 1][target.x - 2] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y + 1][target.x - 2] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y - 2][target.x - 1] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y + 2][target.x - 1] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y - 2][target.x + 1] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y + 2][target.x + 1] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y - 1][target.x + 2] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y + 1][target.x + 2] == (enemyColor + 'N')) { // 나이트의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y - 1][target.x - 1] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y][target.x - 1] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y + 1][target.x - 1] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y - 1][target.x] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y + 1][target.x] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y - 1][target.x + 1] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y][target.x + 1] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    try {
        if (position[target.y + 1][target.x + 1] == (enemyColor + 'K')) { // 킹의 공격을 받는 위치일 때
            return true;
        }
    } catch (e) {

    }

    // 상
    for (var j = target.y - 1; j >= 0; j--) {
        if (position[j][target.x].charAt(0) == myColor) { // 아군 기물로 막혀있으면 공격받지 않음
            break;
        } else {
            var temp = position[j][target.x].charAt(1);
            if (temp == 'B' || temp == 'K' || temp == 'N' || temp == 'P') {
                break;
            } else if (temp == 'R' || temp == 'Q') {
                return true;
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
                return true;
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
                return true;
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
                return true;
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
                return true;
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
                return true;
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
                return true;
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
                return true;
            }
        }
    }

    return false;
}