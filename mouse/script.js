Addon_Id = "mouse";

if (window.Addon == 1) {
	var xml = OpenXml("mouse.xml", false, true);
	for (var mode in eventTE.Mouse) {
		var items = xml.getElementsByTagName(mode);
		for (i = 0; i < items.length; i++) {
			var item = items[i];
			SetGestureExec(mode, item.getAttribute("Mouse"), item.text, item.getAttribute("Type"));
		}
	}
}
