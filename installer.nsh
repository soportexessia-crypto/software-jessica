!macro preInit
  ; Read from both Current User and Local Machine uninstall keys
  ReadRegStr $0 HKCU "${INSTALL_REGISTRY_KEY}" "QuietUninstallString"
  ReadRegStr $1 HKLM "${INSTALL_REGISTRY_KEY}" "QuietUninstallString"

  ; Store the uninstall string in $2
  StrCpy $2 ""
  ${If} $0 != ""
    StrCpy $2 $0
  ${ElseIf} $1 != ""
    StrCpy $2 $1
  ${Else}
    ; Try reading normal UninstallString if Quiet version is not found
    ReadRegStr $0 HKCU "${INSTALL_REGISTRY_KEY}" "UninstallString"
    ReadRegStr $1 HKLM "${INSTALL_REGISTRY_KEY}" "UninstallString"
    ${If} $0 != ""
      StrCpy $2 $0
    ${ElseIf} $1 != ""
      StrCpy $2 $1
    ${EndIf}
  ${EndIf}

  ${If} $2 != ""
    ; Display YES/NO/CANCEL dialog in Spanish (only checking IDYES and IDNO, Cancel naturally falls through to Abort)
    MessageBox MB_YESNOCANCEL|MB_ICONQUESTION \
      "Se ha detectado una instalacion previa de XESSIA Software Jessica.$\n$\n¿Que deseas hacer?$\n$\n- [SI]: ACTUALIZAR la aplicacion conservando tus datos (esto cerrara automaticamente cualquier proceso activo).$\n- [NO]: ELIMINAR / DESINSTALAR la version anterior por completo antes de continuar.$\n- [CANCELAR]: SALIR del instalador sin realizar cambios." \
      /SD IDYES IDYES Upgrade IDNO Uninstall

    ; Fallback if they click Cancel (neither Yes nor No)
    Abort

    Upgrade:
      ; Force kill any running processes of the app to prevent file-locking
      ExecWait 'taskkill /F /IM "XESSIA Software Jessica.exe" /T'
      Goto EndOfDetect

    Uninstall:
      ; Close the running processes first to prevent locked uninstaller
      ExecWait 'taskkill /F /IM "XESSIA Software Jessica.exe" /T'
      ; Run the uninstaller of the previous version
      ExecWait '$2'
      ; Give it 2 seconds to complete
      Sleep 2000
      Goto EndOfDetect

    EndOfDetect:
  ${Else}
    ; If no registry entry exists, but a zombie process is running, terminate it to prevent lock
    ExecWait 'taskkill /F /IM "XESSIA Software Jessica.exe" /T'
  ${EndIf}
!macroend
