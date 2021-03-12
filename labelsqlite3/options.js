const s = [];
if (await MainWindow.Sync.LabelSQLite3) {
	s.push('<input type="button" value="Load" onclick="Addons.LabelSQLite3.Import()"><br><input type="button" value="Save" onclick="Addons.LabelSQLite3.Export()"><br><br>');
}
for (let i = 32; i <= 64; i += 32) {
	s.push('<label>Path</label> (sqlite3.dll) <label>', i, '-bit</label><br><input type="text" name="Path', i, '" placeholder="winsqlite3.dll" style="width: 100%" onchange="Addons.LabelSQLite3.Info()"><br>');
	s.push('<input type="button" value="Browse..." onclick="RefX(\'Path', i, '\', false, this, true, \'*.dll\')">');
	s.push('<input type="button" value="Portable" onclick="PortableX(\'Path', i, '\')"><br><br>');
}
s.push('<label>Information</label> (<label>', await api.sizeof("HANDLE") * 8, '-bit</label>)<div id="Info"></div><br>');
s.push('<br><input type="button" value="', await api.sprintf(999, await GetText("Get %s..."), "SQLite3.dll"), '" title="http://www.sqlite.org/" onclick="wsh.Run(this.title)">');

SetTabContents(0, "", s.join(""));

Addons.LabelSQLite3 = {
	Import: async function () {
		const commdlg = await api.CreateObject("CommonDialog");
		commdlg.InitDir = BuildPath(ui_.DataFolder, "config")
		commdlg.Filter = await MakeCommDlgFilter("*.tsv");
		commdlg.Flags = OFN_FILEMUSTEXIST;
		if (await commdlg.ShowOpen()) {
			MainWindow.Sync.LabelSQLite3.Load(await commdlg.FileName);
		}
	},

	Export: async function () {
		const commdlg = await api.CreateObject("CommonDialog");
		commdlg.InitDir = BuildPath(ui_.DataFolder, "config")
		commdlg.Filter = await MakeCommDlgFilter("*.tsv");
		commdlg.DefExt = "tsv";
		commdlg.Flags = OFN_OVERWRITEPROMPT;
		if (await commdlg.ShowSave()) {
			MainWindow.Sync.LabelSQLite3.Save(await commdlg.FileName);
		}
	},

	Info: async function () {
		const dllPath = await ExtractPath(te, document.F.elements["Path" + ui_.bit].value) || 'winsqlite3.dll';
		const hDll = await api.LoadLibraryEx(dllPath, 0, 0);
		const arProp = ["sqlite3_open", "sqlite3_close", "sqlite3_exec"];
		const arHtml = [];
		for (let i = 0; i < arProp.length; ++i) {
			arHtml.push('<input type="checkbox" ');
			if (await api.GetProcAddress(hDll, arProp[i])) {
				arHtml.push("checked");
			}
			arHtml.push(' onclick="return false;">', arProp[i], '<br>');
		}
		api.FreeLibrary(hDll);
		document.getElementById("Info").innerHTML = arHtml.join("");
	}
}

Addons.LabelSQLite3.Info();
