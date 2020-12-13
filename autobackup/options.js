let s = ['<label>Path</label><table class="layout">'];
s.push('<tr><td style="width: 100%"><input type="text" name="Path" style="width: 100%"></td>');
s.push('<td class="buttons"><input type="button" value="Portable" onclick="PortableX(\'Path\')"></td>');
s.push('<td><input type="button" value="Browse..." onclick="RefX(\'Path\', false, this, false, \'', await api.LoadString(hShell32, 4131), '#*.folder\')"></td></tr></table><br>');
s.push('<label>Number of items</label><br>');
s.push('<input type="text" name="Items" style="width: 100%">');
SetTabContents(0, "General", s);

s = ['<form name="E"><label>Path</label><table class="layout">'];
s.push('<tr><td style="width: 100%"><input type="text" name="Path" style="width: 100%" onchange="Addons.AutoBackup.Changed(this)"></td>');
s.push('<td><input type="button" value="Browse..." onclick="Addons.AutoBackup.SelectBackup(this)"></td></tr></table><br>');

s.push('<input type="button" id="Restore" value="@shell32.dll,-24129[-31334]" disabled="true" onclick="Addons.AutoBackup.Restore()">');
s.push('</form>');
SetTabContents(4, "Restore", s);

Addons.AutoBackup = {
	SelectBackup: async function (o) {
		const pt = await GetPosEx(o, 9);
		const path = await BrowseForFolder(await api.PathSearchAndQualify(await ExtractPath(te, document.F.Path.value || "%TE_Config%\\..\\backup")), pt);
		if (path) {
			document.E.Path.value = path;
			FireEvent(document.E.Path, "change");
		}
	},

	Changed: async function (o) {
		document.E.Restore.disabled = !await fso.FileExists(BuildPath(o.value, "window.xml"));
	},

	Restore: async function () {
		if (await confirmOk()) {
			MainWindow.g_.strUpdate = ['"', await api.IsWow64Process(await api.GetCurrentProcess()) ? await wsh.ExpandEnvironmentStrings("%SystemRoot%\\Sysnative") : system32, "\\", "wscript.exe", '" "', ui_.Installed, "\\script\\update.js", '" "', ui_.TEPath, '" ', await api.PathQuoteSpaces(document.E.Path.value), ' "', await api.LoadString(hShell32, 12612), '" "" ', await api.PathQuoteSpaces(BuildPath(ui_.DataFolder, "config"))].join("");
			MainWindow.DeleteTempFolder = await MainWindow.PerformUpdate;
			api.PostMessage(ui_.hwnd, WM_CLOSE, 0, 0);
		}
	}
}
