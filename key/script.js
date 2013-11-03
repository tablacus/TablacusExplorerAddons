if (window.Addon == 1) {
	var xml = OpenXml("key.xml", false, true);
	for (var mode in eventTE.Key) {
		var items = xml.getElementsByTagName(mode);
		if (items.length == 0 && api.strcmpi(mode, "List") == 0) {
			items = xml.getElementsByTagName("Folder");
		}
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			SetKeyExec(mode, item.getAttribute("Key"), item.text, item.getAttribute("Type"));
		}
	}
}
