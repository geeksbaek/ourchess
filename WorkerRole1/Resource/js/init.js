function init(room) {
  this.socket = io.connect();
  $('#chessBoard').hide();
  if (!Modernizr.canvas) {
    // Only support IE10, Chrome, Firefox, Opera, Safari
    location = '/Error';
  } else {
    window.OURCHESS = {
      room: room,

      theCanvas: document.getElementById('canvas'),
      context: document.getElementById('canvas').getContext('2d'),

      theDragCanvas: document.getElementById('dragCanvas'),
      dragContext: document.getElementById('dragCanvas').getContext('2d'),

      chessBoardDiv: $('#chessBoard'),
      record: $('#record'),
      textInput: $('#textInput'),

      blackColor: '#b58863',
      WhiteColor: '#f0d9b5',

      gameOn: false,

      myId: null,
      myColor: null,
      enemyColor: null,
      movePermission: false,

      PIECE_SIZE: null,
      BOARD_SIZE: null,

      oldPiecePosition: null,
      piecePosition: null,
      dragObj: null,

      recordingPosition: [],
      threefoldRepetition: false,

      check: false,
      castle: true,
      queenSideCastle: true,
      kingSideCastle: true,

      audioElement: document.createElement('audio')
    }

    document.body.appendChild(OURCHESS.audioElement);

    dragDisable();
    setRayout();
    basicEvent();

    $("#bgPopup").data("state", 0);
    $("#Popup").css('max-width', '50%');
    $("#Popup").css('paddingRight', $("#Popup").css('paddingLeft'));

    $("#Popup").on('click', function () { disablePopup(); });
    $("#Popup").on('touchstart', function () { disablePopup(); });

    $(OURCHESS.textInput).keyup(function (e) { // 엔터 입력시 메시지 전송
      if (e.keyCode == 13 && $(OURCHESS.textInput).val() != '') {
        socket.emit('sendMessage', { name: OURCHESS.myColor == 'W' ? 'White' : OURCHESS.myColor == 'B' ? 'Black' : 'Guest[' + OURCHESS.myId + ']', message: $(OURCHESS.textInput).val() });
        $(OURCHESS.textInput).val('');
      }
    });

    $(':input').live('focus', function () { // 자동완성 금지
      $(this).attr('autocomplete', 'off');
    });
  }
}

function setRayout() {
  if ($(window).width() > $(window).height() || $(window).width() >= 650) { // 가로모드 or 데스크탑
    OURCHESS.PIECE_SIZE = ($(window).height() / 8) < 60 ? ($(window).height() / 8) - 4 : 60;
    OURCHESS.BOARD_SIZE = OURCHESS.PIECE_SIZE * 8;

    $(OURCHESS.record).css('marginLeft', 4);
    $(OURCHESS.record).css('marginBottom', 4);
    $(OURCHESS.textInput).css('marginLeft', 4);

    $(OURCHESS.record).css('width', OURCHESS.BOARD_SIZE / 2.5);
    $(OURCHESS.record).css('height', OURCHESS.BOARD_SIZE - 10 - $(OURCHESS.textInput).outerHeight() - 4);
    $(OURCHESS.textInput).css('width', OURCHESS.BOARD_SIZE / 2.5);
  } else { // 세로모드
    OURCHESS.PIECE_SIZE = ($(window).width() / 8) < 60 ? ($(window).width() / 8) - 4 : 60;
    OURCHESS.BOARD_SIZE = OURCHESS.PIECE_SIZE * 8;

    $(OURCHESS.record).css('marginTop', 4);
    $(OURCHESS.record).css('marginBottom', 4);

    $(OURCHESS.record).css('height', OURCHESS.BOARD_SIZE / 3.5);
    $(OURCHESS.record).css('width', OURCHESS.BOARD_SIZE - 10);
    $(OURCHESS.textInput).css('width', OURCHESS.BOARD_SIZE - 10);

    $(OURCHESS.record).css('float', 'left');
    $(OURCHESS.textInput).css('float', 'left');

    $(OURCHESS.chessBoardDiv).css('width', OURCHESS.BOARD_SIZE + 8);
  }

  OURCHESS.theCanvas.width = OURCHESS.BOARD_SIZE; // 캔버스 고유 API인 모양, jQuery의 css 메소드로 설정하면 캔버스가 깨짐
  OURCHESS.theCanvas.height = OURCHESS.BOARD_SIZE;
  OURCHESS.theDragCanvas.width = OURCHESS.PIECE_SIZE;
  OURCHESS.theDragCanvas.height = OURCHESS.PIECE_SIZE;

  $(OURCHESS.chessBoardDiv).center();
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