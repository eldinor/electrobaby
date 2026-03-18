!include "FileAssociation.nsh"
!include "nsDialogs.nsh"

!ifndef BUILD_UNINSTALLER
  Var AssociateModelsCheckbox
  Var ShouldAssociateModels

  !macro customPageAfterChangeDir
    Page Custom ModelAssociationsPageCreate ModelAssociationsPageLeave
  !macroend

  Function ModelAssociationsPageCreate
    nsDialogs::Create 1018
    Pop $0

    ${NSD_CreateLabel} 0u 0u 100% 36u "You can let Windows Explorer open .glb and .gltf files with ${PRODUCT_NAME}."
    Pop $1

    ${NSD_CreateCheckbox} 0u 46u 100% 12u "Associate .glb and .gltf files with ${PRODUCT_NAME}"
    Pop $AssociateModelsCheckbox
    ${NSD_SetState} $AssociateModelsCheckbox ${BST_UNCHECKED}

    ${NSD_CreateLabel} 0u 68u 100% 42u "Warning: .gltf files can reference nearby .bin and texture files. Explorer opening works best when those sidecar files stay next to the .gltf file."
    Pop $2

    nsDialogs::Show
  FunctionEnd

  Function ModelAssociationsPageLeave
    ${NSD_GetState} $AssociateModelsCheckbox $ShouldAssociateModels
  FunctionEnd
!endif

!macro customInstall
  ${If} $ShouldAssociateModels == ${BST_CHECKED}
    !insertmacro APP_ASSOCIATE "glb" "BabylonPress.Model.glb" "GLB 3D Model" "$appExe,0" "Open with ${PRODUCT_NAME}" "$\"$appExe$\" $\"%1$\""
    !insertmacro APP_ASSOCIATE "gltf" "BabylonPress.Model.gltf" "GLTF 3D Model" "$appExe,0" "Open with ${PRODUCT_NAME}" "$\"$appExe$\" $\"%1$\""
    !insertmacro UPDATEFILEASSOC
    WriteRegStr SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" "AssociateModelFiles" "true"
  ${Else}
    WriteRegStr SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" "AssociateModelFiles" "false"
  ${EndIf}
!macroend

!macro unregisterFileAssociations
  ReadRegStr $0 SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" "AssociateModelFiles"
  ${If} $0 == "true"
    !insertmacro APP_UNASSOCIATE "glb" "BabylonPress.Model.glb"
    !insertmacro APP_UNASSOCIATE "gltf" "BabylonPress.Model.gltf"
    !insertmacro UPDATEFILEASSOC
  ${EndIf}
!macroend
