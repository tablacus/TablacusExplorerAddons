var Addon_Id = "confirmdrop";

if (window.Addon == 1) {
	Addons.ConfirmDrop = {
		strName: GetAddonInfo(Addon_Id).Name,
	};

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect, pgrfKeyState) {
		if ((grfKeyState & MK_RBUTTON) || Ctrl.Type == CTRL_WB) {
			return;
		}
		switch (Ctrl.Type) {
			case CTRL_SB:
			case CTRL_EB:
			case CTRL_TV:
				var Dest = Ctrl.HitTest(pt);
				if (Dest) {
					if (!api.DropTarget(Dest)) {
						Dest = Ctrl.FolderItem;
					}
				} else {
					Dest = Ctrl.FolderItem;
				}
				delete Addons.ConfirmDrop.hr;
				if (!confirmOk(api.LoadString(hShell32, 4098).replace("%s", Dest.Path), Addons.ConfirmDrop.strName + ' - ' + TITLE)) {
					return S_OK;
				}
				break;
		}
		
	}, true);
}
