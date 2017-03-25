  
chrome.webNavigation.onCommitted.addListener(function(details){
    var transType = details.transitionType;

    if (transType === 'typed' || 
        transType === 'auto_bookmark' || 
        transType === 'generated' ||
        transType === 'reload') {
        
        // ignore internal Google Chrome urls
        if (details.url.indexOf('/_/chrome/newtab') > -1)
            return;
        var data = JSON.stringify(
            { "cmd": 'open', 
              "target": details.url, 
              "timestamp": (new Date()).getTime() 
        });
        
        var recorderUrl = details.url.indexOf('https:') == 0 ? "https://localhost:8889" : "http://localhost:7778";
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", recorderUrl, false);
        try {
            xmlhttp.send(data);
            if (xmlhttp.status !== 200) {
                console.log("ERROR cmdSend: " + xmlhttp.statusText);
            }
        }
        catch (e) {
            console.error('Error sending request to recorder', e);
        }
    }      
});