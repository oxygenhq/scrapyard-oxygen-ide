@echo off

pushd "%~dp0\..\selenium"
wmic process where commandline="java  -Dwebdriver.chrome.driver=chromedriver.exe -Dwebdriver.ie.driver=IEDriverServer_x86.exe -jar selenium-server-standalone-3.0.1.jar -port 4444 -timeout 240 -browserTimeout 240" Call Terminate >nul 2>nul
start /min "Selenium" java -Dwebdriver.chrome.driver=chromedriver.exe -Dwebdriver.ie.driver=IEDriverServer_x86.exe -jar selenium-server-standalone-3.0.1.jar -port 4444 -timeout 240 -browserTimeout 240
popd
set "nodepath=%~dp0"
pushd "%~dp0\..\resources\app\node_modules\oxygen"
"%nodepath%\node.exe" "lib\cli" -server=http://localhost:4444/wd/hub %*
wmic process where commandline="java  -Dwebdriver.chrome.driver=chromedriver.exe -Dwebdriver.ie.driver=IEDriverServer_x86.exe -jar selenium-server-standalone-3.0.1.jar -port 4444 -timeout 240 -browserTimeout 240" Call Terminate >nul 2>nul
popd