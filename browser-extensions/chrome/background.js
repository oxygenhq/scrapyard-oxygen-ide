var url = location.protocol === 'https:' ? "https://localhost:8889" : "http://localhost:7778";
   
chrome.webNavigation.onCommitted.addListener(function(details){
    var transType = details.transitionType;

    if (transType === 'typed' || 
        transType === 'auto_bookmark' || 
        transType === 'generated' ||
        transType === 'reload') {

        var data = JSON.stringify(
            { "cmd": 'open', 
              "target": details.url, 
              "timestamp": (new Date()).getTime() 
        });

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", url, false);
        xmlhttp.send(data);
        if (xmlhttp.status !== 200) {
            console.log("ERROR cmdSend: " + xmlhttp.statusText);
        }
    }      
});