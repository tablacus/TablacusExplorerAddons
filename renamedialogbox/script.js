var Addon_Id = "renamedialogbox";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("KeyExec", true);
		item.setAttribute("KeyOn", "List");
		item.setAttribute("Key", "F2");
		item.setAttribute("MouseOn", "List");
	}
}
if (window.Addon == 1) {
	Addons.RenameDialogBox =
	{
		strName: "Rename Dialog Box...",
		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				var Focused = FV.FocusedItem;
				if (Focused) {
					if (api.GetAttributesOf(Focused, SFGAO_CANRENAME)) {
						var s = api.GetDisplayNameOf(Focused, SHGDN_FOREDITING);
						var r = InputDialog(s, s);
						if (r && s != r) {
							try {
								Focused.Name = r;
							}
							catch (e) {
							}
						}
					}
					return S_OK;
				}
			}
		}
	};
	if (items.length) {
		var s = item.getAttribute("MenuName");
		if (s && s != "") {
			Addons.RenameDialogBox.strName = GetText(s);
		}
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.RenameDialogBox.nPos = api.LowPart(item.getAttribute("MenuPos"));
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
			{
				if (item && item.IsFileSystem) {
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
}
