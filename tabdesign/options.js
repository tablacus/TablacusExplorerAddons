let g_nPanel = 0;
const arCss = ["default", "activetab", "tab", "tab2", "tab3", "tab0",];
const arExt = ["default", "selected", "left", "right", "new", "base",];

SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

SetCss = async function (a, b, c, d) {
	if (!await confirmOk()) {
		return;
	}
	for (let i = 0; i < arCss.length; ++i) {
		ImportCss1({}, arExt[i], arCss[i]);
		ImportCss1({}, arExt[i] + ':before', arCss[i] + '_before');
		ImportCss1({}, arExt[i] + ':after', arCss[i] + '_after');
	}
	document.F.activetab.value = a.replace(/; +/g, ";\n");
	document.F.elements["default"].value = b.replace(/; +/g, ";\n");
}

ChangeTab = function (o) {
	if (/(\d+)/.test(o.id)) {
		const nIndex = RegExp.$1;
		if (nIndex != g_nPanel) {
			for (let i = 6; i--;) {
				document.getElementById("asel" + i).className = i < nIndex ? "tab" : "tab2";
			}
			document.getElementById("apanel" + g_nPanel).style.display = "none";
			o.className = "activetab";
			document.getElementById("apanel" + nIndex).style.display = "block";
			g_nPanel = nIndex;
		}
	}
}

ExportCss = async function () {
	const commdlg = await api.CreateObject("CommonDialog");
	commdlg.InitDir = BuildPath(ui_.DataFolder, "config");
	commdlg.Filter = await MakeCommDlgFilter("*.css");
	commdlg.DefExt = "xml";
	commdlg.Flags = OFN_OVERWRITEPROMPT;
	if (!await commdlg.ShowSave()) {
		return;
	}
	let strCss = "";
	for (var i = 0; i < arCss.length; ++i) {
		strCss += ExportCss1(arExt[i], arCss[i]);
		strCss += ExportCss1(arExt[i] + ':before', arCss[i] + '_before');
		strCss += ExportCss1(arExt[i] + ':after', arCss[i] + '_after');
	}
	WriteTextFile(await commdlg.FileName, strCss);
}

ExportCss1 = function (name, name2) {
	const o = document.F.elements[name2];
	return  o ? ['.', name, ' {\r\n  ', o.value.replace(/\{\}/, "").replace(/\n/g, '\r\n  '), '\r\n}\r\n\r\n'].join("") : "";
}

ImportCss = async function () {
	const commdlg = await api.CreateObject("CommonDialog");
	commdlg.InitDir = BuildPath(await te.Data.DataFolder, "config");
	commdlg.Filter = await MakeCommDlgFilter("*.css");
	commdlg.Flags = OFN_FILEMUSTEXIST;
	if (!await commdlg.ShowOpen()) {
		return;
	}
	const s = (await ReadTextFile(await commdlg.FileName)).split(/}\s*/m);
	const cls = {};
	for (let i in s) {
		const ar = s[i].split(/\s*{\s*/m);
		cls[ar[0]] = ar[1];
	}
	for (var i = 0; i < arCss.length; i++) {
		ImportCss1(cls, arExt[i], arCss[i]);
		ImportCss1(cls, arExt[i] + ':before', arCss[i] + '_before');
		ImportCss1(cls, arExt[i] + ':after', arCss[i] + '_after');
	}
}

ImportCss1 = function (cls, name, name2) {
	const o = document.F.elements[name2];
	if (o) {
		o.value = (cls['.' + name] || "").replace(/^ {1,2}|\s*$/gm, "");
	}
}
