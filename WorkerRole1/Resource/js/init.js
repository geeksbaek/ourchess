function init(room) {
    if (!Modernizr.canvas) {
        return;
    } else {
        this.socket = io.connect();
        this.room = room;

        this.theCanvas = document.getElementById('canvas');
        this.context = theCanvas.getContext('2d');

        this.theDragCanvas = document.getElementById('dragCanvas');
        this.dragContext = theDragCanvas.getContext('2d');

        this.chessBoardDiv = document.getElementById('chessBoard');
        this.record = document.getElementById('record');

        this.myColor;
        this.enemyColor;
        this.movePermission = false;

        this.PIECE_SIZE;
        this.BOARD_SIZE;

        setResolution();
        
        this.oldPiecePosition;
        this.piecePosition;
        this.dragObj;

        this.check = false;
        this.castle = true;
        this.queenSideCastle = true;
        this.kingSideCastle = true;

        theCanvas.width = BOARD_SIZE;
        theCanvas.height = BOARD_SIZE;

        theDragCanvas.width = PIECE_SIZE;
        theDragCanvas.height = PIECE_SIZE;

        this.canvasBorder = window.getComputedStyle(theCanvas, null).getPropertyValue('border-top-width').replace(/[^0-9]/g, '');

        this.chessBoardDivMarginTop = (window.innerHeight / 2) - (chessBoardDiv.offsetHeight / 2);
        this.chessBoardDivMarginLeft = (window.innerWidth / 2) - (chessBoardDiv.offsetWidth / 2);

        chessBoardDiv.style.marginTop = chessBoardDivMarginTop + 'px';
        chessBoardDiv.style.marginLeft = chessBoardDivMarginLeft + 'px';

        window.addEventListener('resize', function () {
            chessBoardDivMarginTop = (window.innerHeight / 2) - (chessBoardDiv.offsetHeight / 2);
            chessBoardDivMarginLeft = (window.innerWidth / 2) - (chessBoardDiv.offsetWidth / 2);
            chessBoardDiv.style.marginTop = chessBoardDivMarginTop + 'px';
            chessBoardDiv.style.marginLeft = chessBoardDivMarginLeft + 'px';
            setResolution();
        }, false);

        document.onselectstart = new Function('return false');

        basicEvent();
    }
}

function saveImage() {
    window.open(theCanvas.toDataURL(), '', 'width=' + BOARD_SIZE + ', height=' + BOARD_SIZE);
}

function setResolution() {
    var recordVisible = true;

    if ($(window).width() > $(window).height()) { // 가로모드
        if ($(window).height() > 500) { // 데스크탑
            PIECE_SIZE = 55;
        } else { // 모바일
            PIECE_SIZE = 40;
        }
    } else { // 세로모드
        if ($(window).width() > 700) { // 데스크탑
            PIECE_SIZE = 55;
        } else { // 모바일
            PIECE_SIZE = 40;
            recordVisible = false;
        }
    }

    BOARD_SIZE = PIECE_SIZE * 8;

    var padding = record.style.padding = '10px';
    record.style.pixelWidth = BOARD_SIZE / 3;
    record.style.pixelHeight = BOARD_SIZE - (padding.replace('px', '') * 2);
    record.value = 'todo.' + '\n' + '체크메이트 여부 검사' + '\n' + '반응형 해상도 구현' + '\n' + '디자인 개선';

    if (recordVisible) {
        $('#record').show();
    } else {
        $('#record').hide();
    }
}