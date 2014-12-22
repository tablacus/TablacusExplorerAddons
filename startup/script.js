var Addon_Id = "startup";

if (window.Addon == 1) {
	if (xmlWindow) {
		AddEventEx(window, "load", function ()
		{
			var items = te.Data.Addons.getElementsByTagName(Addon_Id);
			if (items.length) {
				var item = items[0];
				Exec(te, item.getAttribute("Path"), item.getAttribute("Type"), te.hwnd);
			}
		});
	}
}
