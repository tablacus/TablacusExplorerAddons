if (window.Addon == 1) {
	AddEvent("GetTabName", function (Ctrl)
	{
		var s = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
		if (isNaN(s) && s.charAt(0) != ":") {
			var s2 = Ctrl.FolderItem.Name;
			if (!s2.match(":")) {
				return [s2, ' (', fso.GetDriveName(s), ')'].join("");
			}
		}
	});
}
