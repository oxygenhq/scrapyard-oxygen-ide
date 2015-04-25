var url = location.protocol === 'https:' ? "https://localhost:8889" : "http://localhost:7778";

var script = getScript(url);
if (script != null) {
    addScript(script);
}

function addScript(scContent) {
    var script = document.createElement('script');
    script.textContent = scContent;
    (document.head || document.body).appendChild(script);
    script.parentNode.removeChild(script);
}
function getScript(url) {
    var req = new XMLHttpRequest();
    try {
        req.open("GET", url + '/res', false);
        req.send();
    } catch(exception) {
        return null;
    }
    if (req.status === 200) {
        return req.responseText;
    }
    return null;
}