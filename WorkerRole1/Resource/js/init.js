function init(room) {
  this.socket = io.connect();
  $('#chessBoard').hide();

  if (!Modernizr.canvas) {
    location = '/Error';
  } else {
    this.room = room;

    this.theCanvas = document.getElementById('canvas');
    this.context = theCanvas.getContext('2d');

    this.theDragCanvas = document.getElementById('dragCanvas');
    this.dragContext = theDragCanvas.getContext('2d');

    this.chessBoardDiv = $('#chessBoard');
    this.record = $('#record');
    this.textInput = $('#textInput');

    this.myId;
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

    this.audioElement = document.createElement('audio');
    document.body.appendChild(audioElement);

    dragDisable();
    setRayout();
    basicEvent();

    $("#bgPopup").data("state", 0);
    $("#Popup").on('click', function () { disablePopup(); });
    $("#Popup").on('touchstart', function () { disablePopup(); });
    $(textInput).keyup(function (e) {
      if (e.keyCode == 13 && $(textInput).val() != '') {
        socket.emit('sendMessage', { name: myColor == 'W' ? 'White' : myColor == 'B' ? 'Black' : 'Guest[' + myId + ']', message: $(textInput).val() });
        $(textInput).val('');
      }
    });
    $(':input').live('focus', function () {
      $(this).attr('autocomplete', 'off');
    });
  }
}

function setRayout() {
  if ($(window).width() > $(window).height() || $(window).width() >= 650) { // 가로모드 or 데스크탑
    PIECE_SIZE = ($(window).height() / 8) < 60 ? ($(window).height() / 8) - 4 : 60;
    BOARD_SIZE = PIECE_SIZE * 8;

    $(record).css('marginLeft', 4);
    $(record).css('marginBottom', 4);
    $(textInput).css('marginLeft', 4);

    $(record).css('width', BOARD_SIZE / 2.5);
    $(record).css('height', BOARD_SIZE - 10 - $(textInput).outerHeight() - 4);
    $(textInput).css('width', BOARD_SIZE / 2.5);
  } else { // 세로모드
    PIECE_SIZE = ($(window).width() / 8) < 60 ? ($(window).width() / 8) - 4 : 60;
    BOARD_SIZE = PIECE_SIZE * 8;

    $(record).css('marginTop', 4);
    $(record).css('marginBottom', 4);

    $(record).css('height', BOARD_SIZE / 3.5);
    $(record).css('width', BOARD_SIZE - 10);
    $(textInput).css('width', BOARD_SIZE - 10);

    $(record).css('float', 'left');
    $(textInput).css('float', 'left');

    $(chessBoardDiv).css('width', BOARD_SIZE + 8);
  }

  theCanvas.width = BOARD_SIZE; // 캔버스 고유 API인 모양, jQuery의 css 메소드로 설정하면 캔버스가 깨짐
  theCanvas.height = BOARD_SIZE;
  theDragCanvas.width = PIECE_SIZE;
  theDragCanvas.height = PIECE_SIZE;

  $(chessBoardDiv).center();
  $('#Popup').center();
}

jQuery.fn.center = function () {
  this.css("position", "absolute");
  this.css("top", Math.max(0, (($(window).height() - this.outerHeight()) / 2)));
  this.css("left", Math.max(0, (($(window).width() - this.outerWidth()) / 2)));
}

function dragDisable() {
  var t_preventDefault = function (evt) { evt.preventDefault(); };
  $(document).bind('dragstart', t_preventDefault).bind('selectstart', t_preventDefault);
}