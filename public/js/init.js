function init(room, loadedPiece) {
  this.socket = io.connect();

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
    orientation: null,

    oldPiecePosition: null,
    piecePosition: null,
    dragObj: null,

    loadedPiece: loadedPiece,

    recordingPosition: [],
    threefoldRepetition: false,

    check: false,
    castle: true,
    queenSideCastle: true,
    kingSideCastle: true,

    audioElement: document.createElement('audio'),
    bgPopup: $("#bgPopup"),
    Popup: $("#Popup"),
    contents: $('#contents')
  }

  document.body.appendChild(OURCHESS.audioElement);

  dragDisable();
  basicEvent();

  OURCHESS.bgPopup.data("state", 0);

  OURCHESS.Popup.css('max-width', '50%');
  OURCHESS.Popup.css('paddingRight', OURCHESS.Popup.css('paddingLeft'));

  OURCHESS.Popup.on('click', function () { disablePopup(); });
  OURCHESS.bgPopup.on('click', function () { disablePopup(); });
  OURCHESS.Popup.on('touchstart', function () { disablePopup(); });

  OURCHESS.textInput.keyup(function (e) { // 엔터 입력시 메시지 전송
    if (e.keyCode == 13 && OURCHESS.textInput.val() != '') {
      socket.emit('sendMessage', { name: OURCHESS.myColor == 'W' ? 'White' : OURCHESS.myColor == 'B' ? 'Black' : 'Guest[' + OURCHESS.myId + ']', message: OURCHESS.textInput.val() });
      OURCHESS.textInput.val('');
    }
  });

  // $(':input').live('focus', function () { // 자동완성 금지
  //   $(this).attr('autocomplete', 'off');
  // });
}


function setRayout() {
  var isLandscape = $(window).width() > $(window).height();
  var sidebarWidth = OURCHESS.orientation == 'portrait' ? (OURCHESS.BOARD_SIZE / 2.5) + 22 : OURCHESS.textInput.outerWidth();
  var canvasWidth = $('#canvas').outerWidth();
  var canvas_sidebarMargin = Number(OURCHESS.textInput.css('marginLeft').replace('px', ''));
  var padding = Number(OURCHESS.chessBoardDiv.css('paddingLeft').replace('px', '')) * 2;

  var isLandscapePossible = isLandscape && canvasWidth + sidebarWidth + canvas_sidebarMargin + padding < $(window).width();

  if (isLandscapePossible) { // 가로모드
    var realHeight = $(window).height() - padding - 8;
    // 8은 canvas border width * 2

    OURCHESS.PIECE_SIZE = realHeight / 8 < 60 ? realHeight / 8 : 60;
    OURCHESS.BOARD_SIZE = OURCHESS.PIECE_SIZE * 8;

    OURCHESS.record.css('margin', '0px 0px 4px 4px');
    OURCHESS.record.css('float', 'right');
    OURCHESS.textInput.css('margin', '0px 0px 0px 4px');
    OURCHESS.textInput.css('float', 'right');

    OURCHESS.record.css('width', OURCHESS.BOARD_SIZE / 2.5);
    OURCHESS.textInput.css('width', OURCHESS.BOARD_SIZE / 2.5);
    // 임의의 사이드바 width

    OURCHESS.record.css('height', OURCHESS.BOARD_SIZE - OURCHESS.textInput.outerHeight() - 4 - 10);
    // margin bottom 4px + (padding 5px * 2). border width를 계산 안한 건 canvas border width가 BOARD_SIZE 사이즈에 더해지지 않아서

    OURCHESS.chessBoardDiv.css('width', 'auto');

    OURCHESS.orientation = 'landscape';
  } else { // 세로모드
    var realWidth = $(window).width() - padding - 8;

    OURCHESS.PIECE_SIZE = realWidth / 8 < 60 ? realWidth / 8 : 60;
    OURCHESS.BOARD_SIZE = OURCHESS.PIECE_SIZE * 8;

    OURCHESS.record.css('margin', '4px 0px 4px 0px');
    OURCHESS.record.css('float', 'left');
    OURCHESS.textInput.css('margin', '0');
    OURCHESS.textInput.css('float', 'left');

    OURCHESS.record.css('width', OURCHESS.BOARD_SIZE - 10);
    OURCHESS.textInput.css('width', OURCHESS.BOARD_SIZE - 10);
    // 10은 pading * 2

    OURCHESS.record.css('height', OURCHESS.BOARD_SIZE / 3.5);
    // 임의의 height

    OURCHESS.chessBoardDiv.css('width', OURCHESS.BOARD_SIZE + 8);
    // width가 auto일 시 자동으로 조정되지 않아서 수동으로 사이즈 조절

    OURCHESS.orientation = 'portrait';
  }

  OURCHESS.theCanvas.width = OURCHESS.BOARD_SIZE; // 캔버스 고유 API인 모양, jQuery의 css 메소드로 설정하면 캔버스가 깨짐
  OURCHESS.theCanvas.height = OURCHESS.BOARD_SIZE;
  OURCHESS.theDragCanvas.width = OURCHESS.PIECE_SIZE;
  OURCHESS.theDragCanvas.height = OURCHESS.PIECE_SIZE;

  OURCHESS.bgPopup.css("width", $(window).width());
  OURCHESS.bgPopup.css("height", $(window).height());
  OURCHESS.record.scrollTop(OURCHESS.record[0].scrollHeight);

  OURCHESS.chessBoardDiv.center();
  OURCHESS.Popup.center();
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

function cleartheCanvas() {
  OURCHESS.context.save();

  OURCHESS.context.setTransform(1, 0, 0, 1, 0, 0);
  OURCHESS.context.clearRect(0, 0, OURCHESS.theCanvas.width, OURCHESS.theCanvas.height);

  OURCHESS.context.restore();
}

function cleartheDragCanvas() {
  OURCHESS.dragContext.save();

  OURCHESS.dragContext.setTransform(1, 0, 0, 1, 0, 0);
  OURCHESS.dragContext.clearRect(0, 0, OURCHESS.theDragCanvas.width, OURCHESS.theDragCanvas.height);

  OURCHESS.dragContext.restore();
}

function onResize() {
  setRayout();
  draw(true);
  OURCHESS.chessBoardDiv.center();
  OURCHESS.Popup.center();
  $('#progress').center();
}

function preloadImage(room) {
  $('#chessBoard').hide();

  var loader = new PxLoader();
  var progress = $('#progress');
  var progressbar = $('#progressbar');

  progress.css('width', $(window).width() / 2);
  progress.center();
  progress.show();

  var ret = {
    'BB': loader.addImage('/img/BB.png'),
    'BK': loader.addImage('/img/BK.png'),
    'BN': loader.addImage('/img/BN.png'),
    'BP': loader.addImage('/img/BP.png'),
    'BQ': loader.addImage('/img/BQ.png'),
    'BR': loader.addImage('/img/BR.png'),

    'WB': loader.addImage('/img/WB.png'),
    'WK': loader.addImage('/img/WK.png'),
    'WN': loader.addImage('/img/WN.png'),
    'WP': loader.addImage('/img/WP.png'),
    'WQ': loader.addImage('/img/WQ.png'),
    'WR': loader.addImage('/img/WR.png')
  };

  loader.addProgressListener(function (e) {
    progressbar.css('width', parseInt(progress.css('width').replace('px', '') * (e.completedCount / e.totalCount)));
  });

  loader.addCompletionListener(function () {
    init(room, ret);

    setTimeout(function () {
      progress.fadeOut(300);
    }, 500);
  });

  loader.start();
}