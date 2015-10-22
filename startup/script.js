if (window.Addon == 1) {
	AddEvent("Create", function (Ctrl)
	{
		if (Ctrl.Type == CTRL_TE) {
			var items = te.Data.Addons.getElementsByTagName("startup");
			if (items.length) {
				var item = items[0];
				var s = item.getAttribute("Type");
				if (api.PathMatchSpec(s, "Open;Open in New Tab;Open in Background")) {
					(function (strPath, strType) { setTimeout(function () {
						Exec(te, strPath, strType, te.hwnd);
					}, 999);}) (item.getAttribute("Path"), s);
				} else {
					Exec(te, item.getAttribute("Path"), s, te.hwnd);
				}
			}
		}
	});
}
