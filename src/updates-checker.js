var https = require("https");

(function() {
    module.exports = UpdatesChecker;

    function UpdatesChecker(currentVer, cb) {
        get((status,response) => {
            if (status == 200) {
                var result = parse(response);
                var updateAvailable = isNewer(result.version, currentVer);
                cb(result.version, updateAvailable, getDownloadUrl(result.downloads));
            } else {
                console.error('Failure checking for updates: ' + status + ' - ' + response.message);
            }
        });

        function get(onResult){
            var options = {
                host: 'api.github.com',
                port: 443,
                path: '/repos/oxygenhq/oxygen-ide/releases/latest',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'user-agent': 'node.js'
                }
            };

            var req = https.request(options, function(res)
            {
                var output = '';
                res.setEncoding('utf8');

                res.on('data', function(chunk) {
                    output += chunk;
                });

                res.on('end', function() {
                    var obj = JSON.parse(output);            
                    onResult(res.statusCode, obj);
                });
            });

            req.on('error', function(err) {
                onResult(status, err);
            });

            req.end();
        }

        function parse(json) {
            var res = {
                version: json.tag_name,
                notes: json.body
            };

            res.downloads = [];
            if (json.assets.length > 0) {
                json.assets.forEach((asset) => {
                    res.downloads.push(asset.browser_download_url);
                });
            }

            return res;
        }

        function isNewer(latest, current) {
            var c = current.split('.');
            var majc = parseInt(c[0]);
            var minc = parseInt(c[1]);
            var ptcc = parseInt(c[2]);
            var l = latest.split('.');
            var majl = parseInt(l[0]);
            var minl = parseInt(l[1]);
            var ptcl = parseInt(l[2]);
            return majl > majc || (minl > minc && majl >= majc) || (ptcl > ptcc && majl >= majc && minl >= minc);
        }

        function getDownloadUrl(downloads) {
            var platform;
            switch (process.platform) {
                case 'win32':
                    platform = 'win'; break;
                case 'darwin':
                    platform = 'osx'; break;
                case 'linux':
                default:
                    platform = 'linux'; break;
            }

            var package = platform  + '-' + process.arch;

            for (download of downloads) {
                if (download.indexOf(package) > 0) {
                    return download;
                }
            }
        }
    }
}).call(this);
