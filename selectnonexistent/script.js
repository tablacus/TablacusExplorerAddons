const Addon_Id = "selectnonexistent";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.SelectNonexistent = {
		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV && await FV.Items) {
				FV.Focus();
				await FV.SelectItem(null, SVSI_DESELECTOTHERS);
				for (let i = await FV.Items.Count; i-- > 0;) {
					const pid = await FV.Items.Item(i);
					if (await pid.Size < 0 && await pid.ExtendedProperty("Access") == null && await pid.ExtendedProperty("Write") == null) {
						FV.SelectItem(pid, SVSI_SELECT);
					}
				}
			}
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("SelectNonexistent", item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
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
