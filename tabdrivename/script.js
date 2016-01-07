if (window.Addon == 1) {
	Addons.TabDriveName = { Pos: api.LowPart(GetAddonOption("tabdrivename", "Pos")) };
	AddEvent("GetTabName", function (Ctrl)
	{
		var res = /^(\w):/.exec(api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX));
		if (res) {
			var s = res[1];
			var s2 = Ctrl.FolderItem.Name;
			if (!/:/.test(s2)) {
				return Addons.TabDriveName.Pos ? [s, ')', s2].join("") : [s2, '(', s, ')'].join("");
			}
		}
	});
}
