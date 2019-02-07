var Addon_Id = "renamedialogbox";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("KeyExec", true);
	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "F2");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.RenameDialogBox =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				var Focused = FV.FocusedItem;
				if (Focused) {
					if (api.GetAttributesOf(Focused, SFGAO_CANRENAME)) {
						var s = api.GetDisplayNameOf(Focused, SHGDN_FOREDITING | SHGDN_INFOLDER);
						var r = s;
						for (;;) {
							var r = InputDialog(s, r);
							if (/[\\\/:,;\*\?"<>\|]/.test(r)) {
								MessageBox(api.LoadString(hShell32, 4109), null, MB_ICONSTOP | MB_OK);
							} else {
								break;
							}
						};
						if (r && s != r) {
							try {
								Focused.Name = r;
							} catch (e) {
								MessageBox(api.LoadString(hShell32, 6020).replace("%1!ls!", api.sprintf(99, "0x%x", e.number)).replace("%2!ls!", s), null, MB_ICONSTOP | MB_OK);
							}
						}
					}
					return S_OK;
				}
			}
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
		{
			if (item && item.IsFileSystem && api.GetAttributesOf(item, SFGAO_CANRENAME)) {
				api.InsertMenu(hMenu, Addons.RenameDialogBox.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.RenameDialogBox.strName);
				ExtraMenuCommand[nPos] = Addons.RenameDialogBox.Exec;
			}
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.RenameDialogBox.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.RenameDialogBox.Exec, "Func");
	}
	AddTypeEx("Add-ons", "Rename Dialog Box...", Addons.RenameDialogBox.Exec);
}
