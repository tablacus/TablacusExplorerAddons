AddEvent("GetTabName", function (Ctrl) {
	const s = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
	if (isNaN(s) && s.charAt(0) != ":") {
		const a = s.split("\\");
		while (a.length > 2) {
			a.shift();
		}
		return a.join("\\");
	}
});
