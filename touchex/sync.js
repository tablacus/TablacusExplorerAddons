const Addon_Id = "touchex";
const item = GetAddonElement(Addon_Id);

Sync.TouchEx = {
	sName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name + "...",

	Exec: function (Ctrl, pt) {
		const Selected = (GetSelectedArray(Ctrl, pt, true)).shift();
		if (Selected && Selected.Count) {
			const opt = api.CreateObject("Object");
			opt.MainWindow = $;
			opt.Selected = Selected;
			opt.width = 320;
			opt.height = 280;
			ShowDialog("../addons/touchex/dialog.html", opt);
		}
	}
}

//Menu
if (item.getAttribute("MenuExec")) {
	Sync.TouchEx.nPos = GetNum(item.getAttribute("MenuPos"));
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		if (item && item.IsFileSystem) {
			api.InsertMenu(hMenu, Sync.TouchEx.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.TouchEx.sName);
			ExtraMenuCommand[nPos] = Sync.TouchEx.Exec;
		}
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.TouchEx.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.TouchEx.Exec, "Func");
}

AddTypeEx("Add-ons", "Change the timestamp", Sync.TouchEx.Exec);
