SetTabContents(4, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

const arIndex = ["Name", "Path", "Icon1", "Category"];
const fnConfig = BuildPath(ui_.DataFolder, "config\\jumplist.tsv");

SaveIC = async function (mode) {
	if (g_Chg[mode]) {
		let data = "";
		for (var i = 0; i < g_x.List.length; i++) {
			data += g_x.List[i].value.replace(new RegExp(g_sep, "g"), "\t") + "\r\n";
		}
		WriteTextFile(fnConfig, data);
	}
}

EditIC = function (mode) {
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	ClearX("List");
	const a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	for (let i = arIndex.length; i--;) {
		document.E.elements[arIndex[i]].value = a[i] || "";
	}
	ShowIconX();
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

SetNameX = async function (o) {
	ChangeX('List');
	const el = document.E.Name;
	if (el.value === "") {
		const sfi = await api.Memory("SHFILEINFO");
		await api.SHGetFileInfo(PathUnquoteSpaces(o.value), 0, sfi, await sfi.Size, SHGFI_TYPENAME);
		el.value = await sfi.szTypeName;
	}
}

ShowIconX = async function () {
	const fn = await ExtractPath(te, document.E.Icon1.value);
	const h = await api.GetSystemMetrics(SM_CYSMICON);
	document.getElementById('icon_').src = /^icon:|\.ico/.test(fn) ? await MakeImgSrc(fn, 0, h) : "";
}

GetCurrentX = async function () {
	if (!await confirmOk()) {
		return;
	}
	const FV = await te.Ctrl(CTRL_FV);
	document.E.Name.value = await FV.FolderItem.Name;
	document.E.Path.value = await FV.FolderItem.Path;
	document.E.Icon1.value = "";
	document.E.Category.value = "";
}

SaveLocation = async function () {
	if (g_Chg.Data) {
		ReplaceIC("List");
	}
	await SaveIC("List");
};

setTimeout(async function () {
	g_x.List = document.E.List;
	const ar = (await ReadTextFile(fnConfig)).split(/\r?\n/);
	while (ar.length) {
		const line = ar.shift();
		if (line) {
			const i = g_x.List.length++;
			SetData(g_x.List[i], line.split("\t"));
		}
	}
	EnableSelectTag(g_x.List);
}, 99);
