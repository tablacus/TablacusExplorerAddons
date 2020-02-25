var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(4, "", ado.ReadText(adReadAll));
	ado.Close();
}

var arIndex = ["Filter", "Path"];
var fnConfig = fso.BuildPath(te.Data.DataFolder, "config\\bgimage.tsv");

function SaveIC(mode)
{
	if (g_Chg[mode]) {
		var ado = api.CreateObject("ads");
		ado.CharSet = "utf-8";
		ado.Open();
		for (var i = 0; i < g_x.List.length; i++) {
			ado.WriteText(g_x.List[i].value.replace(new RegExp(g_sep, "g"), "\t") + "\r\n");
		}
		ado.SaveToFile(fnConfig, adSaveCreateOverWrite);
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
		var el = document.E.elements[arIndex[i]];
		if (String(el.type).toLowerCase() == 'checkbox') {
			el.checked = a[i];
		} else {
			el.value = a[i] || "";
		}
	}
	ShowIconX();
	document.E.Filter.value = document.E.Filter.value;
}

ReplaceIC = function(mode)
{
	ClearX();
	if (g_x[mode].selectedIndex < 0) {
		g_x[mode].selectedIndex = ++g_x[mode].length - 1;
	}
	var a = [];
	for (var i = arIndex.length; i--;) {
		var el = document.E.elements[arIndex[i]];
		if (String(el.type).toLowerCase() == 'checkbox') {
			a.unshift(el.checked ? 1 : 0);
		} else {
			a.unshift(el.value);
		}
	}
	SetData(g_x.List[g_x.List.selectedIndex], a);
	g_Chg[mode] = true;
}

ShowIconX = function()
{
	document.getElementById('Image1').src = ExtractMacro(te, document.E.Path.value);
}

GetCurrentPath = function ()
{
	if (confirmOk()) {
		document.E.Filter.value = te.Ctrl(CTRL_FV).FolderItem.Path;
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
