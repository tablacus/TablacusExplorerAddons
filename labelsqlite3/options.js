var s = ['<input type="button" value="Load" onclick="Addons.LabelSQLite3.Import()"><br><input type="button" value="Save" onclick="Addons.LabelSQLite3.Export()"><br><br>'];
for (var i = 32; i <= 64; i += 32) {
	s.push('<label>Path</label> (sqlite3.dll) <label>', i, '-bit</label><br><input type="text" name="Path', i, '" placeholder="winsqlite3.dll" style="width: 100%" onchange="Addons.LabelSQLite3.Info()"><br>');
	s.push('<input type="button" value="Browse..." onclick="RefX(\'Path', i, '\', false, this, true, \'*.dll\')">');
	s.push('<input type="button" value="Portable" onclick="PortableX(\'Path', i, '\')"><br><br>');
}
s.push('<label>Information</label> (<label>', api.sizeof("HANDLE") * 8, '-bit</label>)<div id="Info"></div><br>');
s.push('<br><input type="button" value="', api.sprintf(999, GetText("Get %s..."), "SQLite3.dll"), '" title="http://www.sqlite.org/" onclick="wsh.Run(this.title)">');

SetTabContents(0, "", s.join(""));

Addons.LabelSQLite3.Import = function () {
	var commdlg = api.CreateObject("CommonDialog");
	commdlg.InitDir = fso.BuildPath(te.Data.DataFolder, "config")
	commdlg.Filter = MakeCommDlgFilter("*.tsv");
	commdlg.Flags = OFN_FILEMUSTEXIST;
	if (commdlg.ShowOpen()) {
		(MainWindow.Addons.LabelSQLite3 || Addons.LabelSQLite3).Load(commdlg.FileName);
	}
}

Addons.LabelSQLite3.Export = function () {
	var commdlg = api.CreateObject("CommonDialog");
	commdlg.InitDir = fso.BuildPath(te.Data.DataFolder, "config")
	commdlg.Filter = MakeCommDlgFilter("*.tsv");
	commdlg.DefExt = "tsv";
	commdlg.Flags = OFN_OVERWRITEPROMPT;
	if (commdlg.ShowSave()) {
		(MainWindow.Addons.LabelSQLite3 || Addons.LabelSQLite3).Save(commdlg.FileName);
	}
}

Addons.LabelSQLite3.Info = function () {
	var dllPath = api.PathUnquoteSpaces(ExtractMacro(te, document.F.elements["Path" + (api.sizeof("HANDLE") * 8)].value) || 'winsqlite3.dll');
	var hDll = api.LoadLibraryEx(dllPath, 0, 0);
	var arProp = ["sqlite3_open", "sqlite3_close", "sqlite3_exec"];
	var arHtml = [];
	for (var i = 0; i < arProp.length; ++i) {
		arHtml.push('<input type="checkbox" ');
		if (api.GetProcAddress(hDll, arProp[i])) {
			arHtml.push("checked");
		}
		arHtml.push(' onclick="return false;">', arProp[i], '<br>');
	}
	api.FreeLibrary(hDll);
	document.getElementById("Info").innerHTML = arHtml.join("");
}

AddEventEx(window, "load", Addons.LabelSQLite3.Info);
