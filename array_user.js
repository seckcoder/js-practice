function logArrayElements (element, index, array) {
    console.log("a[" + index + "] = " + element);
}
function forEachUser (/**/) {
    function logArrayElements (element) {
        console.log("Element: " + element);
    }
    var arr = ["a", "b", "c"];
    arr.forEach(logArrayElements);
}
function array_user (/**/) {
    forEachUser();
}
