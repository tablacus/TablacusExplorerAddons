var Addon_Id = "retouch";
var item = GetAddonElement(Addon_Id);

Sync.Retouch = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: api.LowPart(item.getAttribute("MenuPos")),

	Exec: function (Ctrl, pt) {
		var FV = GetFolderView(Ctrl, pt);
		if (FV) {
			var Selected = FV.SelectedItems();
			if (Selected.Count) {
				FV.Focus();
				var opt = api.CreateObject("Object");
				opt.MainWindow = window;
				opt.width = 800;
				opt.height = 600;
				ShowDialog("../addons/retouch/preview.html", opt);
			}
		}
	}
};

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.Retouch.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.Retouch.strName);
		ExtraMenuCommand[nPos] = Sync.Retouch.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.Retouch.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.Retouch.Exec, "Func");
}

AddTypeEx("Add-ons", "Retouch", Sync.Retouch.Exec);
