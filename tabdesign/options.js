var g_nPanel = 0;
var arCss = ["default", "activetab", "tab", "tab2", "tab3", "tab0", ];
var arExt = ["default", "selected", "left", "right", "new", "base", ];

var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(0, "", ado.ReadText(adReadAll));
	ado.Close();
}

SetCss = function (a, b, c, d)
{
	if (confirmOk("Are you sure?")) {
		for (var i = 0; i < arCss.length; i++) {
			ImportCss1({}, arExt[i], arCss[i]);
			ImportCss1({}, arExt[i] + ':before', arCss[i] + '_before');
			ImportCss1({}, arExt[i] + ':after', arCss[i] + '_after');
		}
		document.F.activetab.value = a.replace(/; +/g, ";\n");
		document.F.elements["default"].value = b.replace(/; +/g, ";\n");
	}
}

ChangeTab = function (o)
{
	if (/(\d+)/.test(o.id)) {
		var nIndex = RegExp.$1;
		if (nIndex != g_nPanel) {
			for (var i = 6; i--;) {
				document.getElementById("asel" + i).className = i < nIndex ? "tab" : "tab2";
			}
			document.getElementById("apanel" + g_nPanel).style.display = "none";
			o.className = "activetab";
			document.getElementById("apanel" + nIndex).style.display = "block";
			g_nPanel = nIndex;
		}
	}
}

ExportCss = function ()
{
	var commdlg = api.CreateObject("CommonDialog");
	commdlg.InitDir = fso.BuildPath(te.Data.DataFolder, "config");
	commdlg.Filter = MakeCommDlgFilter("*.css");
	commdlg.DefExt = "xml";
	commdlg.Flags = OFN_OVERWRITEPROMPT;
	if (commdlg.ShowSave()) {
		try {
			var ado = api.CreateObject("ads");
			ado.CharSet = "utf-8";
			ado.Open();
			for (var i = 0; i < arCss.length; i++) {
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

ExportCss1 = function (ado, name, name2)
{
	var o = document.F.elements[name2];
	if (o) {
		ado.WriteText(['.', name, ' {\n  ', o.value.replace(/\{\}/, "").replace(/\n/g, '\n  '), '\n}\n\n'].join(""));
	}
}

ImportCss = function ()
{
	var commdlg = api.CreateObject("CommonDialog");
	commdlg.InitDir = fso.BuildPath(te.Data.DataFolder, "config");
	commdlg.Filter = MakeCommDlgFilter("*.css");
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
				for (var i = 0; i < arCss.length; i++) {
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

ImportCss1 = function (cls, name, name2)
{
	var o = document.F.elements[name2];
	if (o) {
		o.value = (cls['.' + name] || "").replace(/^ {1,2}|\s*$/gm, "");
	}
}
