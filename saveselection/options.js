SetTabContents(4, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

ConfigFile = BuildPath(ui_.DataFolder, "config", Addon_Id + ".tsv");

SaveIC = async function (mode) {
	if (g_Chg[mode]) {
		let data = "";
		for (let i = 0; i < g_x.List.length; i++) {
			data += g_x.List[i].value.replace(new RegExp(g_sep, "g"), "\t") + "\r\n";
		}
		await WriteTextFile(ConfigFile, data);
		g_Chg[mode] = false;
		if (await MainWindow.Sync.SaveSelection) {
			MainWindow.Sync.SaveSelection.bSave = false;
		}
	}
}

EditIC = function (mode) {
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	ClearX("List");
	const a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	document.E.Path.value = a[0] || "";
	document.E.Selection.value = (a.slice(1) || []).join("\n");
}

ReplaceIC = function (mode) {
	ClearX();
	if (g_x[mode].selectedIndex < 0) {
		g_x[mode].selectedIndex = ++g_x[mode].length - 1;
	}
	const a = document.E.Selection.value.replace(/^\r?\n|\r?\n$/m, "").split(/\r?\n/);
	a.unshift(document.E.Path.value);
	SetData(g_x.List[g_x.List.selectedIndex], a);
	g_Chg[mode] = true;
}

SaveLocation = async function () {
	if (g_Chg.Data) {
		ReplaceIC("List");
	}
	await SaveIC("List");
};

setTimeout(async function () {
	g_x.List = document.E.List;

	if (await MainWindow.Sync.SaveSelection) {
		await MainWindow.Sync.SaveSelection.ENumCB(function (n, s) {
			const ar = s.split("\t");
			ar.unshift(n);
			const i = g_x.List.length++;
			SetData(g_x.List[i], ar);
		});
	} else {
		const ar = (await ReadTextFile(ConfigFile)).split(/\r?\n/);
		while (ar.length) {
			const line = ar.shift();
			if (line) {
				const i = g_x.List.length++;
				SetData(g_x.List[i], line.split("\t"));
			}
		}
	}
	EnableSelectTag(g_x.List);
}, 99);
