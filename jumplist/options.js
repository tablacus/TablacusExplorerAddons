var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(4, "General", ado.ReadText(adReadAll));
	ado.Close();
}

var arIndex = ["Name", "Path", "Icon1", "Category"];
var fnConfig = fso.BuildPath(te.Data.DataFolder, "config\\jumplist.tsv");

function SaveIC(mode)
{
	if (g_Chg[mode]) {
		var ado = api.CreateObject("ads");
		ado.CharSet = "utf-8";
		ado.Open();
		for (var i = 0; i < g_x.List.length; i++) {
			ado.WriteText(g_x.List[i].value.replace(new RegExp(g_sep, "g"), "\t") + "\r\n");
		}
		ado.SaveToFile(fso.BuildPath(te.Data.DataFolder, "config\\jumplist.tsv"), adSaveCreateOverWrite);
		ado.Close();
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
	ShowIconX();
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
	SetData(g_x.List[g_x.List.selectedIndex], a);
	g_Chg[mode] = true;
}

SetNameX = function(o)
{
	ChangeX('List');
	var el = document.E.Name;
	if (el.value === "") {
		var sfi = api.Memory("SHFILEINFO");
		api.SHGetFileInfo(api.PathUnquoteSpaces(o.value), 0, sfi, sfi.Size, SHGFI_TYPENAME);
		el.value = sfi.szTypeName;
	}
}

ShowIconX = function () {
	var fn = api.PathUnquoteSpaces(ExtractMacro(te, document.E.Icon1.value));
	var h = api.GetSystemMetrics(SM_CYSMICON);
	document.getElementById('icon_').src = /^icon:|\.ico/.test(fn) ? MakeImgSrc(fn, 0, h) : "";
}

GetCurrentX = function () {
	if (confirmOk()) {
		var FV = te.Ctrl(CTRL_FV);
		document.E.Name.value = FV.FolderItem.Name;
		document.E.Path.value = FV.FolderItem.Path;
		document.E.Icon1.value = "";
		document.E.Category.value = "";
	}
}

g_x.List = document.E.List;

var ar = [];
try {
	var ado = OpenAdodbFromTextFile(fnConfig);
	while (!ado.EOS) {
		ar.push(ado.ReadText(adReadLine));
	}
	ado.Close();
} catch (e) {}

g_x.List.length = ar.length;
for (var i = 0; i < ar.length; i++) {
	SetData(g_x.List[i], ar[i].split("\t"));
}
EnableSelectTag(g_x.List);

SaveLocation = function ()
{
	if (g_Chg.Data) {
		ReplaceIC("List");
	}
	SaveIC("List");
};
