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

        this.chessBoardDiv = $('#chessBoard');
        this.record = $('#record');

        this.myColor;
        this.enemyColor;
        this.movePermission = false;

        this.PIECE_SIZE;
        this.BOARD_SIZE;

        this.oldPiecePosition;
        this.piecePosition;
        this.dragObj;

        this.check = false;
        this.castle = true;
        this.queenSideCastle = true;
        this.kingSideCastle = true;


        dragDisable();
        setRayout();
        basicEvent();

        $("#bgPopup").data("state", 0);
        $("#Popup").on('click', function () { disablePopup(); });
        $("#Popup").on('touchstart', function () { disablePopup(); });
    }
}

function setRayout() {
    if ($(window).width() > $(window).height() || $(window).width() >= 650) { // 가로모드
        PIECE_SIZE = ($(window).height() / 8) < 60 ? ($(window).height() / 8) - 3 : 60;
        BOARD_SIZE = PIECE_SIZE * 8;

        $(record).css('padding', 10)
        $(record).css('marginLeft', 2);
        $(record).css('marginTop', 0);
        $(record).css('width', BOARD_SIZE / 3);
        $(record).css('height', BOARD_SIZE - ($(record).css('paddingLeft').replace('px', '') * 2));

        $(chessBoardDiv).css('width', 'auto');
    } else { // 세로모드
        PIECE_SIZE = ($(window).width() / 8) < 60 ? ($(window).width() / 8) - 3 : 60;
        BOARD_SIZE = PIECE_SIZE * 8;

        $(record).css('padding', 10)
        $(record).css('marginLeft', 0);
        $(record).css('marginTop', 2);
        $(record).css('width', BOARD_SIZE - ($(record).css('paddingLeft').replace('px', '') * 2));
        $(record).css('height', BOARD_SIZE / 3);

        $(chessBoardDiv).css('width', $(record).outerWidth());
    }

    $(record).css('marginRight', 0);
    $(record).css('marginBottom', 0);

    if (typeof myColor === 'undefined') {
        theCanvas.width = BOARD_SIZE; // 캔버스 고유 API인 모양, jQuery의 css 메소드로 설정하면 캔버스가 깨짐
        theCanvas.height = BOARD_SIZE;

        theDragCanvas.width = PIECE_SIZE;
        theDragCanvas.height = PIECE_SIZE;
    }

    $(chessBoardDiv).center();
}

jQuery.fn.center = function () {
    this.css("position", "absolute");
    this.css("top", Math.max(0, (($(window).height() - this.outerHeight()) / 2) + $(window).scrollTop()));
    this.css("left", Math.max(0, (($(window).width() - this.outerWidth()) / 2) + $(window).scrollLeft()));
}

function dragDisable() {
    var t_preventDefault = function (evt) { evt.preventDefault(); };
    $(document).bind('dragstart', t_preventDefault).bind('selectstart', t_preventDefault);
}