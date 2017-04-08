@echo off

set "selpath=%~dp0\..\selenium"
java -Dwebdriver.chrome.driver="%selpath%\chromedriver.exe" -Dwebdriver.ie.driver="%selpath%\IEDriverServer_x86.exe" -jar "%selpath%\selenium-server-standalone-3.0.1.jar" -port 4444