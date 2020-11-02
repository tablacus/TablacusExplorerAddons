var Addon_Id = "attributes";
var item = GetAddonElement(Addon_Id);

Common.Attributes = {
	strName: GetText(item.getAttribute("MenuName") || "Attributes..."),
	Exec: function (Ctrl) {
		var Selected = GetSelectedArray(Ctrl, pt, true).shift();
		if (Selected && Selected.Count) {
			var h = 110 + 26 * Selected.Count;
			if (h > 480) {
				h = 480;
			}
			var opt = api.CreateObject("Object");
			opt.MainWindow = window;
			opt.width = 640;
			opt.height = h;
			ShowDialog("../addons/attributes/dialog.html", opt);
		}
	}
}

//Menu
if (item.getAttribute("MenuExec")) {
	Common.Attributes.nPos = api.LowPart(item.getAttribute("MenuPos"));
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		if (item && item.IsFileSystem) {
			api.InsertMenu(hMenu, Common.Attributes.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.Attributes.strName);
			ExtraMenuCommand[nPos] = Common.Attributes.Exec;
		}
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Common.Attributes.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Common.Attributes.Exec, "Func");
}

AddTypeEx("Add-ons", "Attributes...", Common.Attributes.Exec);
