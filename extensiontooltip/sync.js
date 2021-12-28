Sync.ExtensionTooltip = {
	db: {},
	TFS: api.PSGetDisplayName("System.TotalFileSize")
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
					const n = api.PSGetDisplayName(s);
					let v;
					if (n != Sync.ExtensionTooltip.TFS) {
						v = Item.ExtendedProperty(s);
					} else {
						v = Ctrl.TotalFileSize[api.GetDisplayNameOf(Item, SHGDN_FORPARSING)] || Item.ExtendedProperty("Size");
					}
					const v2 = api.PSFormatForDisplay(s, v, PDFF_DEFAULT);
					dt.push(n + ": " + (v2 || (/string|number|date/.test(typeof v) ? v : "")));
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
let db = JSON.parse(ReadTextFile(BuildPath(te.Data.DataFolder, "config\\extensiontooltip.json")) || "{}");
for (let name in db) {
	const ar = name.toLowerCase().split(/[\.,:;\*\/\\\|]]/);
	for (let i = ar.length; i--;) {
		if (ar[i]) {
			Sync.ExtensionTooltip.db[ar[i]] = db[name];
		}
	}
}
delete db;
//} catch (e) { }
