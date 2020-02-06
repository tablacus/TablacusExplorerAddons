var Addon_Id = "runonexit";

if (window.Addon == 1) {
	AddEvent("Close", function (Ctrl)
	{
		if (Ctrl.Type == CTRL_TE) {
			var item = GetAddonElement('runonexit');
			Exec(te, item.getAttribute("Path"), item.getAttribute("Type"), te.hwnd);
		}
	}, true);
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
