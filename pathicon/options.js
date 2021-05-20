SetTabContents(4, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

ConfigFile = BuildPath(ui_.DataFolder, "config", Addon_Id + ".tsv");

GetIconImage = async function (fn, Large) {
	fn = await ExtractPath(te, fn);
	return await api.CreateObject("WICBitmap").FromFile(fn) || (await MakeImgData(fn, 0, Large ? 48 : 16));
}

SaveIC = async function (mode) {
	if (g_Chg[mode]) {
		let data = "";
		for (let i = 0; i < g_x.List.length; i++) {
			data += g_x.List[i].value.replace(new RegExp(g_sep, "g"), "\t") + "\r\n";
		}
		await WriteTextFile(ConfigFile, data);
		g_Chg[mode] = false;
	}
}

EditIC = function () {
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	ClearX("List");
	const a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	for (let i = arIndex.length; i--;) {
		document.E.elements[arIndex[i]].value = a[i] || "";
	}
	for (let i = 2; i--;) {
		ShowIconX(["Small", "Large"][i], i);
	}
}

ReplaceIC = function (mode) {
	ClearX();
	if (g_x[mode].selectedIndex < 0) {
		g_x[mode].selectedIndex = ++g_x[mode].length - 1;
	}
	const a = [];
	for (let i = arIndex.length; i--;) {
		a.unshift(document.E.elements[arIndex[i]].value);
	}
	SetData(g_x.List[g_x.List.selectedIndex], a);
	g_Chg[mode] = true;
}

ShowIconX = async function (s, i) {
	const h = [16, 96][i] * screen.deviceYDPI / 96;
	document.getElementById("icon_" + i).innerHTML = await GetImgTag({ src: await ExtractPath(te, document.E.elements[s].value) }, h);
}

SaveLocation = async function () {
	if (g_Chg.Data) {
		ReplaceIC("List");
	}
	await SaveIC("List");
};

setTimeout(async function () {
	g_x.List = document.E.List;

	const ar = (await ReadTextFile(ConfigFile)).split(/\r?\n/);
	while (ar.length) {
		const line = ar.shift();
		if (line) {
			const i = g_x.List.length++;
			SetData(g_x.List[i], line.split("\t"));
		}
	}
	EnableSelectTag(g_x.List);
	const path = await dialogArguments.Data.sPath;
	if (path) {
		for (let i = g_x.List.length; --i >=0;) {
			const a = g_x.List[i].value.split(g_sep);
			if (SameText(path, PathUnquoteSpaces(a[0]))) {
				g_x.List.selectedIndex = i;
				EditIC();
				return;
			}
		}
		document.E.Path.value = path;
	}
}, 99);
