var Addon_Id = "touchex";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", 1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}

Sync.TouchEx = {
	strName: GetText(item.getAttribute("MenuName") || "Change the timestamp...") || GetAddonInfo(Addon_Id).Name,

	Exec: function (Ctrl, pt) {
		var Selected = (GetSelectedArray(Ctrl, pt, true)).shift();
		if (Selected && Selected.Count) {
			var opt = api.CreateObject("Object");
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
			api.InsertMenu(hMenu, Sync.TouchEx.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.TouchEx.strName);
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

AddTypeEx("Add-ons", "Change the Time Stamp...", Sync.TouchEx.Exec);
