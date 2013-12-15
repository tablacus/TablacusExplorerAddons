var AddonName = "Icon Changer";
var nTabIndex = 0;
var nTabMax = 0;
var arIndex = ["Type", "Large", "Small", "ExtraLarge", "SysSmall"];
var fnConfig = fso.BuildPath(te.Data.DataFolder, "config\\iconchanger.tsv");

function InitToolOptions()
{
	ApplyLang(document);
	document.title = GetText(AddonName);
	g_x.List = document.F.List;

	var size = api.Memory("SIZE");
	for (var j = SHIL_JUMBO; j--;) {
		himl = api.SHGetImageList(j);
		if (himl) {
			api.ImageList_GetIconSize(himl, size);
			document.getElementById("size" + j).innerHTML = size.cx + "x" + size.cy;
		}
	}
	setTimeout(function ()
	{
		var ar = [];
		try {
			var f = fso.OpenTextFile(fnConfig, 1, false, -1);
			while (!f.AtEndOfStream) {
				ar.push(f.ReadLine());
			}
			f.Close();
		}
		catch (e) {
		}

		if (!ar.length) {
			ar = ["Folder closed", "Folder opened", "Undefined", "Shortcut", "Share"];
		}
		g_x.List.length = ar.length;
		for (var i = 0; i < ar.length; i++) {
			SetData(g_x.List[i], ar[i].split(/\t/));
		}
	}, 100);
}

function SetToolOptions()
{
	if (ConfirmX(true, ReplaceIC)) {
		SaveIC("List");
		TEOk();
		window.close();
	}
}

function SaveIC(mode)
{
	if (g_Chg[mode]) {
		var f = fso.OpenTextFile(fnConfig, 2, true, -1);
		for (var i = 0; i < g_x.List.length; i++) {
			f.WriteLine(g_x.List[i].value.replace(new RegExp(g_sep, "g"), "\t"));
		}
		f.Close();
	}
}

function EditIC(mode)
{
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	ClearX("List");
	var a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	for (var i = arIndex.length; i--;) {
		document.F.elements[arIndex[i]].value = a[i] || "";
	}
	document.F.Type.value = GetText(document.F.Type.value);
}

function ReplaceIC(mode)
{
	ClearX();
	if (g_x[mode].selectedIndex < 0) {
		g_x[mode].selectedIndex = ++g_x[mode].length - 1;
	}
	var a = [];
	for (var i = arIndex.length; i--;) {
		a.unshift(document.F.elements[arIndex[i]].value);
	}
	a[0] = GetSourceText(a[0]);
	SetData(g_x.List[g_x.List.selectedIndex], a);
	g_Chg[mode] = true;
}
