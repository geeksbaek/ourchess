function loadPopup(callback) {
  //loads popup only if it is disabled  
  if (OURCHESS.bgPopup.data("state") == 0) {
    OURCHESS.bgPopup.css({ "opacity": "0.7" });
    OURCHESS.bgPopup.fadeIn("medium");
    OURCHESS.Popup.fadeIn("medium");
    OURCHESS.bgPopup.data("state", 1);

    if (typeof callback != 'undefined') {
      callback();
    }
  }
}

function disablePopup() {
  if (OURCHESS.bgPopup.data("state") == 1) {
    OURCHESS.bgPopup.fadeOut("medium");
    OURCHESS.Popup.fadeOut("medium");
    OURCHESS.bgPopup.data("state", 0);
  }
}

function popup(message, type, doNotAutoClose) {
  OURCHESS.Popup.removeClass();

  switch (type) {
    case 'warning':
      OURCHESS.Popup.addClass("alert alert-block");
      break;
    case 'fail':
      OURCHESS.Popup.addClass("alert alert-error");
      break;
    case 'success':
      OURCHESS.Popup.addClass("alert alert-success");
      break;
    case 'information':
      OURCHESS.Popup.addClass("alert alert-info");
      break;
  }

  OURCHESS.contents.text(message);
  OURCHESS.Popup.center();
  loadPopup();

  if (!doNotAutoClose) {
    setTimeout(function () {
      disablePopup();
    }, 3000);
  }
}