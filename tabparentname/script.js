if (window.Addon == 1) {
	AddEvent("GetTabName", function (Ctrl)
	{
		var s = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
		if (isNaN(s) && s.charAt(0) != ":") {
			var a = s.split("\\");
			while(a.length > 2) {
				a.shift();
			}
			return a.join("\\");
		}
	});
}
