var g_nPanel = 0;
var arCss = ["default", "activetab", "tab", "tab2", "tab3", "tab0", ];
var arExt = ["default", "selected", "left", "right", "new", "base", ];

function SetCss(a, b, c, d)
{
	if (confirmOk("Are you sure?")) {
		for (var i in arCss) {
			ImportCss1({}, arExt[i], arCss[i]);
			ImportCss1({}, arExt[i] + ':before', arCss[i] + '_before');
			ImportCss1({}, arExt[i] + ':after', arCss[i] + '_after');
		}
		document.F.activetab.value = a;
		document.F.elements["default"].value = b;
	}
}

function ChangeTab(o)
{
	if (/(\d+)/.test(o.id)) {
		var nIndex = RegExp.$1;
		if (nIndex != g_nPanel) {
			document.getElementById("sel" + g_nPanel).className = "tab";
			document.getElementById("panel" + g_nPanel).style.display = "none";
			o.className = "activetab";
			document.getElementById("panel" + nIndex).style.display = "block";
			g_nPanel = nIndex;
		}
	}
}

function ExportCss()
{
	var commdlg = te.CommonDialog();
	commdlg.InitDir = fso.BuildPath(te.Data.DataFolder, "config");
	commdlg.Filter = "CSS Files|*.css|" + (api.LoadString(hShell32, 34193) || "All Files") + "|*.*";
	commdlg.DefExt = "xml";
	commdlg.Flags = OFN_OVERWRITEPROMPT;
	if (commdlg.ShowSave()) {
		try {
			var ado = new ActiveXObject(api.ADBSTRM);
			ado.CharSet = "utf-8";
			ado.Open();
			for (var i in arCss) {
				ExportCss1(ado, arExt[i], arCss[i]);
				ExportCss1(ado, arExt[i] + ':before', arCss[i] + '_before');
				ExportCss1(ado, arExt[i] + ':after', arCss[i] + '_after');
			}
			ado.SaveToFile(commdlg.FileName, adSaveCreateOverWrite);
			ado.Close();
		} catch (e) {
			ShowError(e, GetText("Save"));
		}
	}
}

function ExportCss1(ado, name, name2)
{
	var o = document.F.elements[name2];
	if (o) {
		ado.WriteText(['.', name, ' {\n  ', o.value.replace(/\{\}/, "").replace(/\n/g, '\n  '), '\n}\n\n'].join(""));
	}
}

function ImportCss()
{
	var commdlg = te.CommonDialog();
	commdlg.InitDir = fso.BuildPath(te.Data.DataFolder, "config");
	commdlg.Filter = "CSS Files|*.css|" + (api.LoadString(hShell32, 34193) || "All Files") + "|*.*";
	commdlg.Flags = OFN_FILEMUSTEXIST;
	if (commdlg.ShowOpen()) {
		try {
			var ado = OpenAdodbFromTextFile(commdlg.FileName);
			if (ado) {
				var s = ado.ReadText().split(/}\s*/m);
				ado.Close();
				var cls = {};
				for (var i in s) {
					var ar = s[i].split(/\s*{\s*/m);
					cls[ar[0]] = ar[1];
				}
				for (var i in arCss) {
					ImportCss1(cls, arExt[i], arCss[i]);
					ImportCss1(cls, arExt[i] + ':before', arCss[i] + '_before');
					ImportCss1(cls, arExt[i] + ':after', arCss[i] + '_after');
				}
			}
		} catch (e) {
			ShowError(e, GetText("load"));
		}
	}
}

function ImportCss1(cls, name, name2)
{
	var o = document.F.elements[name2];
	if (o) {
		o.value = (cls['.' + name] || "").replace(/^ {1,2}|\s*$/gm, "");
	}
}
