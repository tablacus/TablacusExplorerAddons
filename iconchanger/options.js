var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(4, "General", ado.ReadText(adReadAll));
	ado.Close();
}

var arIndex = ["Type", "Large", "Small", "ExtraLarge", "SysSmall"];
var fnConfig = fso.BuildPath(te.Data.DataFolder, "config\\iconchanger.tsv");

SaveIC = function(mode)
{
	if (g_Chg[mode]) {
		var f = fso.OpenTextFile(fnConfig, 2, true, -1);
		for (var i = 0; i < g_x.List.length; i++) {
			f.WriteLine(g_x.List[i].value.replace(new RegExp(g_sep, "g"), "\t"));
		}
		f.Close();
	}
}

EditIC = function(mode)
{
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	ClearX("List");
	var a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	for (var i = arIndex.length; i--;) {
		document.E.elements[arIndex[i]].value = a[i] || "";
	}
	document.E.Type.value = GetText(document.E.Type.value);
}

ReplaceIC = function(mode)
{
	ClearX();
	if (g_x[mode].selectedIndex < 0) {
		g_x[mode].selectedIndex = ++g_x[mode].length - 1;
	}
	var a = [];
	for (var i = arIndex.length; i--;) {
		a.unshift(document.E.elements[arIndex[i]].value);
	}
	a[0] = GetSourceText(a[0]);
	SetData(g_x.List[g_x.List.selectedIndex], a);
	g_Chg[mode] = true;
}

ApplyLang(document);
var info = GetAddonInfo(Addon_Id);
document.title = info.Name;
g_x.List = document.E.List;

var size = api.Memory("SIZE");
for (var j = SHIL_JUMBO; j--;) {
	himl = api.SHGetImageList(j);
	if (himl) {
		api.ImageList_GetIconSize(himl, size);
		document.getElementById("size" + j).innerHTML = size.cx + "x" + size.cy;
	}
}
var ar = [];
try {
	var f = fso.OpenTextFile(fnConfig, 1, false, -1);
	while (!f.AtEndOfStream) {
		ar.push(f.ReadLine());
	}
	f.Close();
} catch (e) {}

if (!ar.length) {
	ar = ["Folder closed", "Folder opened", "Undefined", "Shortcut", "Share"];
}
g_x.List.length = ar.length;
for (var i = 0; i < ar.length; i++) {
	SetData(g_x.List[i], ar[i].split("\t"));
}
EnableSelectTag(g_x.List);

SetOnChangeHandler();

SaveLocation = function ()
{
	if (g_bChanged) {
		ReplaceIC("List");
	}
	if (g_Chg.List) {
		SaveIC("List");
	}
};
