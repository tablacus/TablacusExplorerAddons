if (window.Addon == 1) {
	AddEvent("Create", function (Ctrl)
	{
		if (Ctrl.Type == CTRL_TE) {
			var item = GetAddonElement('startup');
			if (item) {
				if (item.getAttribute("Shift") && api.GetKeyState(VK_SHIFT) < 0) {
					return;
				}
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
