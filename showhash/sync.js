const Addon_Id = "showhash";
const item = GetAddonElement(Addon_Id);

Sync.ShowHash = {
	sName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,

	Exec: function (Ctrl, pt) {
		const Selected = GetSelectedArray(Ctrl, pt, true).shift();
		if (Selected && Selected.Count && !Selected.Item(0).IsFolder) {
			const opt = api.CreateObject("Object");
			opt.MainWindow = $;
			opt.Selected = Selected;
			opt.width = 640;
			opt.height = 360;
			ShowDialog("../addons/showhash/dialog.html", opt);
		}
	}
}

//Menu
if (item.getAttribute("MenuExec")) {
	Sync.ShowHash.nPos = GetNum(item.getAttribute("MenuPos"));
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		if (item && item.IsFileSystem && !item.IsFolder) {
			api.InsertMenu(hMenu, Sync.ShowHash.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.ShowHash.sName);
			ExtraMenuCommand[nPos] = Sync.ShowHash.Exec;
		}
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.ShowHash.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.ShowHash.Exec, "Func");
}

AddTypeEx("Add-ons", "Show Hash", Sync.ShowHash.Exec);
