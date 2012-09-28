function loadPopup(callback) {
  //loads popup only if it is disabled  
  if ($("#bgPopup").data("state") == 0) {
    $("#bgPopup").css({ "opacity": "0.7" });
    $("#bgPopup").fadeIn("medium");
    $("#Popup").fadeIn("medium");
    $("#bgPopup").data("state", 1);

    if (typeof callback != 'undefined') {
      callback();
    }
  }
}

function disablePopup() {
  if ($("#bgPopup").data("state") == 1) {
    $("#bgPopup").fadeOut("medium");
    $("#Popup").fadeOut("medium");
    $("#bgPopup").data("state", 0);
  }
}

function popup(message) {
  $('#contents').text(message);
  $('#Popup').center();
  loadPopup();
}