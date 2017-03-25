@echo off

set "nodepath=%~dp0"
"%nodepath%\node.exe" "%~dp0\..\resources\app\node_modules\oxygen\bin\oxygen" -server=http://localhost:4444/wd/hub %*
