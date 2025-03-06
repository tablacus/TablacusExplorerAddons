Sync.TabDriveName = {
	Pos: GetNum(GetAddonOption("tabdrivename", "Pos"))
};

AddEvent("GetTabName", function (Ctrl) {
	const res = /^(\w:)/.exec(api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX));
	if (res) {
		const s = res[1];
		const s2 = Ctrl.FolderItem.Name;
		if (!/:/.test(s2)) {
			return Sync.TabDriveName.Pos ? [s, ') ', s2].join("") : [s2, ' (', s, ')'].join("");
		}
	}
});
