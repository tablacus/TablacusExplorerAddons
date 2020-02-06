var Addon_Id = "runatsetup";

if (window.Addon == 1) {
	AddEvent("Load", function (Ctrl)
	{
		var item = GetAddonElement('runatsetup');
		var s = item.getAttribute("Type");
		if (api.PathMatchSpec(s, "Open;Open in New Tab;Open in Background")) {
			(function (strPath, strType) {
				setTimeout(function () {
					Exec(te, strPath, strType, te.hwnd);
				}, 999);
			})(item.getAttribute("Path"), s);
		} else {
			Exec(te, item.getAttribute("Path"), s, te.hwnd);
		}
	});
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
