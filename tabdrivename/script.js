if (window.Addon == 1) {
	Addons.TabDriveName = { Pos: api.LowPart(GetAddonOption("tabdrivename", "Pos")) };
	AddEvent("GetTabName", function (Ctrl)
	{
		if (/^(\w):/.test(api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX))) {
			var s = RegExp.$1;
			var s2 = Ctrl.FolderItem.Name;
			if (!/:/.test(s2)) {
				return Addons.TabDriveName.Pos ? [s, ')', s2].join("") : [s2, '(', s, ')'].join("");
			}
		}
	});
}
