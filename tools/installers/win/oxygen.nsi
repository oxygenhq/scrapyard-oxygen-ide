!define BASEDIR "..\..\.."
!define PRODUCT_NAME "Oxygen"
!define PRODUCT_PUBLISHER "CloudBeat, Inc."
!define PRODUCT_WEB_SITE "http://www.oxygenhq.org"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\oxygenide.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"
!define CHROME_EXTENSION_KEY "Software\Google\Chrome\Extensions\nddikidjcckpefjbnnnpfokienpkondf"

; MUI Settings ------
!include "MUI.nsh"

!define MUI_COMPONENTSPAGE_SMALLDESC
!define MUI_ABORTWARNING
!define MUI_ICON "${BASEDIR}\resources\win\app.ico"
!define MUI_UNICON "${BASEDIR}\resources\win\app.ico"

; Welcome page
!insertmacro MUI_PAGE_WELCOME
; License page
!insertmacro MUI_PAGE_LICENSE "${BASEDIR}\LICENSE"
; Components page
!insertmacro MUI_PAGE_COMPONENTS
; Directory page
!insertmacro MUI_PAGE_DIRECTORY
; Instfiles page
!insertmacro MUI_PAGE_INSTFILES
; Finish page
!define MUI_FINISHPAGE_RUN "$INSTDIR\oxygenide.exe"
!insertmacro MUI_PAGE_FINISH
; Uninstaller pages
!insertmacro MUI_UNPAGE_INSTFILES
; Language files
!insertmacro MUI_LANGUAGE "English"

; MUI end ------

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "${BASEDIR}\dist\OxygenSetup.exe"
InstallDir "$PROGRAMFILES\Oxygen"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

Section "Common Files (Required)" SEC01
    SetOutPath "$INSTDIR"
    SetOverwrite try
    File /r "${BASEDIR}\build\*"
    File "${BASEDIR}\resources\win\app.ico"
    File "${BASEDIR}\browser-extensions\ie\bin\Release\IEAddon.dll"
    
    CreateDirectory "$SMPROGRAMS\Oxygen"
    CreateShortCut "$SMPROGRAMS\Oxygen\Oxygen.lnk" "$INSTDIR\oxygenide.exe"
    CreateShortCut "$DESKTOP\Oxygen.lnk" "$INSTDIR\oxygenide.exe"

    SetOverwrite ifnewer
SectionEnd

Section "Chrome Extension" SEC02
    Call RegisterExtensionChrome
SectionEnd

Section "Internet Explorer Extension" SEC03
    Call RegisterExtensionIE
SectionEnd

Section -AdditionalIcons
  CreateShortCut "$SMPROGRAMS\Oxygen\Uninstall.lnk" "$INSTDIR\uninst.exe"
SectionEnd

Section -Post
    WriteUninstaller "$INSTDIR\uninst.exe"
    WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\oxygenide.exe"
    WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
    WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
    WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\oxygenide.exe"
    WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
    WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
    WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
SectionEnd

; Section descriptions
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
    !insertmacro MUI_DESCRIPTION_TEXT ${SEC01} "Common files."
    !insertmacro MUI_DESCRIPTION_TEXT ${SEC02} "Enables recording support in Chrome."
    !insertmacro MUI_DESCRIPTION_TEXT ${SEC03} "Enables recording support in Internet Explorer."
!insertmacro MUI_FUNCTION_DESCRIPTION_END


Function RegisterExtensionChrome
    WriteRegStr HKLM ${CHROME_EXTENSION_KEY} "update_url" "http://clients2.google.com/service/update2/crx"
FunctionEnd

Function RegisterExtensionIE
    Push $R0

    ReadRegStr $R0 HKEY_LOCAL_MACHINE "Software\Microsoft\.NETFramework" "InstallRoot"

    IfFileExists $R0\v4.0.30319\regasm.exe FileExists
      MessageBox MB_ICONSTOP|MB_OK "Microsoft .NET Framework 4.0/4.5 was not detected!"
    Abort

    FileExists:
    ExecWait '"$R0\v4.0.30319\regasm.exe" "$INSTDIR\IEAddon.dll" /silent /codebase'

    Pop $R0
FunctionEnd

Function un.RegisterExtensionIE
    Push $R0

    ReadRegStr $R0 HKEY_LOCAL_MACHINE "Software\Microsoft\.NETFramework" "InstallRoot"

    IfFileExists $R0\v4.0.30319\regasm.exe FileExists
      MessageBox MB_ICONSTOP|MB_OK "Microsoft .NET Framework 4.0/4.5 was not detected!"
    Abort

    FileExists:
    ExecWait '"$R0\v4.0.30319\regasm.exe" "$INSTDIR\IEAddon.dll" /silent /unregister'

    Pop $R0
FunctionEnd

Function .onInit
  # set SEC01 section as selected and read-only
  IntOp $0 ${SF_SELECTED} | ${SF_RO}
  SectionSetFlags ${SEC01} $0
FunctionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "Oxygen was successfully removed from your computer."
FunctionEnd

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "Are you sure you want to completely remove Oxygen and all of its components?" IDYES +2
  Abort
FunctionEnd

Section Uninstall
    # remove extensions
    Call un.RegisterExtensionIE
    DeleteRegKey HKLM ${CHROME_EXTENSION_KEY}

    # remove start menu and desktop links
    Delete "$SMPROGRAMS\Oxygen\Uninstall.lnk"
    Delete "$DESKTOP\Oxygen.lnk"
    Delete "$SMPROGRAMS\Oxygen\Oxygen.lnk"
    RMDir "$SMPROGRAMS\Oxygen"
    
    # remove installation dir
    RMDir /r /REBOOTOK "$INSTDIR"

    # remove installation reg keys
    DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
    DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"

    SetAutoClose true
SectionEnd