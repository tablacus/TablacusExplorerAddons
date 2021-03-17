const Addon_Id = "confirmdrop";

Sync.ConfirmDrop = {
	strName: GetAddonInfo(Addon_Id).Name,
};

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect, pgrfKeyState) {
	if (grfKeyState & MK_RBUTTON) {
		return;
	}
	switch (Ctrl.Type) {
		case CTRL_SB:
		case CTRL_EB:
		case CTRL_TV:
			let Dest = Ctrl.HitTest(pt);
			if (Dest) {
				if (!api.DropTarget(Dest)) {
					Dest = Ctrl.FolderItem;
				}
			} else {
				Dest = Ctrl.FolderItem;
			}
			if (!confirmOk(Dest ? api.LoadString(hShell32, 4098).replace("%s", Dest.Path) : "", Sync.ConfirmDrop.strName + ' - ' + TITLE)) {
				return S_OK;
			}
			break;
	}
}, true);
