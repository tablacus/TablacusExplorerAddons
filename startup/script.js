Addon_Id = "startup";

if (window.Addon == 1) {
	AddEvent("Create", function (Ctrl)
	{
		if (Ctrl.Type == CTRL_TE) {
			var items = te.Data.Addons.getElementsByTagName(Addon_Id);
			if (items.length) {
				var item = items[0];
				Exec(te, item.getAttribute("Path"), item.getAttribute("Type"), te.hwnd);
			}
		}
	});
}
