Sync.ExtensionTooltip = {
	db: {}
}

AddEvent("ToolTip", function (Ctrl, Index) {
	if (Ctrl.Type <= CTRL_EB && Index >= 0) {
		const Item = Ctrl.Item(Index);
		if (!Item) {
			return;
		}
		let s = Sync.ExtensionTooltip.db[IsFolderEx(Item) ? "folder" : fso.GetExtensionName(Item.Path).toLowerCase()];
		if (!s) {
			return;
		}
		const lines = s.split("\n");
		const dt2 = [];
		for (let j = 0; j < lines.length; ++j) {
			const ar = api.CommandLineToArgv(lines[j]);
			const dt = [];
			for (let i = 0; i < ar.length; ++i) {
				s = api.PSGetDisplayName(ar[i], 2);
				if (s) {
					const v = api.PSFormatForDisplay(s, Item.ExtendedProperty(s), PDFF_DEFAULT);
					dt.push(api.PSGetDisplayName(s) + ": " + (v || ""));
				} else {
					dt.push(Item.ExtendedProperty(ar[i]) || ar[i]);
				}
			}
			dt2.push(dt.join(" "));
		}
		return dt2.join("\n");
	}
});

//try {
let db = JSON.parse(ReadTextFile(BuildPath(te.Data.DataFolder, "config\\extensiontooltip.json")) || {});
for (let name in db) {
	const ar = name.toLowerCase().split(/\W/);
	for (let i = ar.length; i--;) {
		if (ar[i]) {
			Sync.ExtensionTooltip.db[ar[i]] = db[name];
		}
	}
}
delete db;
//} catch (e) { }
