if (window.Addon == 1) {
	var xml = OpenXml("key.xml", false, true);
	for (var mode in eventTE.Key) {
		var items = xml.getElementsByTagName(mode);
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			SetKeyExec(mode, item.getAttribute("Key"), item.text, item.getAttribute("Type"));
		}
	}
}
