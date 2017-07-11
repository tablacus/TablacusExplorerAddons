var ado = OpenAdodbFromTextFile(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\extensionicon\\options.html"));
if (ado) {
	SetTabContents(4, "General", ado.ReadText(adReadAll));
	ado.Close();
}

var arIndex = ["Type", "Small", "Large"];
var fnConfig = fso.BuildPath(te.Data.DataFolder, "config\\extensionicon.tsv");

function SaveIC(mode)
{
	if (g_Chg[mode]) {
		var ado = new ActiveXObject(api.ADBSTRM);
		ado.CharSet = "utf-8";
		ado.Open();
		for (var i = 0; i < g_x.List.length; i++) {
			ado.WriteText(g_x.List[i].value.replace(new RegExp(g_sep, "g"), "\t") + "\r\n");
		}
		ado.SaveToFile(fso.BuildPath(te.Data.DataFolder, "config\\extensionicon.tsv"), adSaveCreateOverWrite);
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
	for (var i = 2; i--;) {
		var image = Addons.ExtensionIcon.GetIconImage(a[i + 1], i);
		document.getElementById('icon_' + i).src = image ? image.DataURI("image/png") : "";
	}
	document.E.Type.value = document.E.Type.value;
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

ShowIconX = function(s, i)
{
	var image = Addons.ExtensionIcon.GetIconImage(document.E.elements[s].value, i);
	document.getElementById('icon_' + i).src = image ? image.DataURI("image/png") : "";
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
	SaveIC("List");
};
