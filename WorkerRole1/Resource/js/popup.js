function loadPopup() {
    //loads popup only if it is disabled  
    if ($("#bgPopup").data("state") == 0) {
        $("#bgPopup").css({ "opacity": "0.7" });
        $("#bgPopup").fadeIn("medium");
        $("#Popup").fadeIn("medium");
        $("#bgPopup").data("state", 1);
    }
}

function disablePopup() {
    if ($("#bgPopup").data("state") == 1) {
        $("#bgPopup").fadeOut("medium");
        $("#Popup").fadeOut("medium");
        $("#bgPopup").data("state", 0);
    }
}