SetTabContents(4, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

const arIndex = ["Type", "Large", "Small", "ExtraLarge", "SysSmall"];
const fnConfig = BuildPath(ui_.DataFolder, "config\\iconchanger.tsv");

SaveIC = async function (mode) {
	if (g_Chg[mode]) {
		let data = "";
		for (let i = 0; i < g_x.List.length; i++) {
			data += g_x.List[i].value.replace(new RegExp(g_sep, "g"), "\t") + "\r\n";
		}
		await WriteTextFile(fnConfig, data);
	}
}

EditIC = async function (mode) {
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	ClearX("List");
	const a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	for (let i = arIndex.length; i--;) {
		document.E.elements[arIndex[i]].value = a[i] || "";
	}
	document.E.Type.value = await GetText(document.E.Type.value);
}

ReplaceIC = async function (mode) {
	ClearX();
	if (g_x[mode].selectedIndex < 0) {
		g_x[mode].selectedIndex = ++g_x[mode].length - 1;
	}
	var a = [];
	for (var i = arIndex.length; i--;) {
		a.unshift(document.E.elements[arIndex[i]].value);
	}
	a[0] = await GetSourceText(a[0]);
	SetData(g_x.List[g_x.List.selectedIndex], a);
	g_Chg[mode] = true;
}

g_x.List = document.E.List;

const size = await api.Memory("SIZE");
for (let j = SHIL_JUMBO; j--;) {
	himl = await api.SHGetImageList(j);
	if (himl) {
		await api.ImageList_GetIconSize(himl, size);
		document.getElementById("size" + j).innerHTML = await size.cx + "x" + await size.cy;
	}
}
const ar = [];
try {
	const ado = await OpenAdodbFromTextFile(fnConfig);
	while (!await ado.EOS) {
		ar.push(await ado.ReadText(adReadLine));
	}
	ado.Close();
} catch (e) { }

if (!ar.length) {
	ar.push("Folder closed", "Folder opened", "Undefined", "Shortcut", "Share");
}
g_x.List.length = ar.length;
for (let i = 0; i < ar.length; i++) {
	SetData(g_x.List[i], ar[i].split("\t"));
}
EnableSelectTag(g_x.List);

SaveLocation = async function () {
	if (g_bChanged) {
		await ReplaceIC("List");
	}
	if (g_Chg.List) {
		await SaveIC("List");
	}
};
