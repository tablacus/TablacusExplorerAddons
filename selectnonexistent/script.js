var Addon_Id = "selectnonexistent";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.SelectNonexistent =
	{
		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV && FV.Items) {
				FV.Focus();
				FV.SelectItem(null, SVSI_DESELECTOTHERS);
				for (var i = FV.Items.Count; i-- > 0;) {
					var pid = FV.Items.Item(i);
					if (pid.ExtendedProperty("Access") == undefined && pid.ExtendedProperty("Write") == undefined && pid.ExtendedProperty("Size") == 0) {
						FV.SelectItem(pid, SVSI_SELECT);
					}
				}
			}
		}
	}

	var s = item.getAttribute("MenuName");
	if (!s) {
		var info = GetAddonInfo(Addon_Id);
		s = info.Name;
	}
	Addons.SelectNonexistent.strName = GetText(s);
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.SelectNonexistent.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
		{
			api.InsertMenu(hMenu, Addons.SelectNonexistent.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.SelectNonexistent.strName);
				ExtraMenuCommand[nPos] = Addons.SelectNonexistent.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SelectNonexistent.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SelectNonexistent.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Select nonexistent items", Addons.SelectNonexistent.Exec);
}
