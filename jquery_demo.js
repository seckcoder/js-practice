$(document).ready(function() {
    initializeInterface();
});
function initializeInterface (/**/) {
}
function demo_html (/**/) {
    beginPopup();
}
function beginPopup (w, h) {
    var width = w ? w : 500;
    var height = h ? h:300;
    $("#popup").css({
        width: width+"px",
        height: height+"px",
        "margin-top": parseInt($(window).height() * (1 - 0.618) - height / 2) + "px"
    });
    $("#popup-wrapper").show();
}
