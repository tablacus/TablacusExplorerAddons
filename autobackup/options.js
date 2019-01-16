var s = ['<label>Path</label><table class="layout">'];
s.push('<tr><td style="width: 100%"><input type="text" name="Path" style="width: 100%" /></td>');
s.push('<td class="buttons"><input type="button" value="Portable" onclick="PortableX(\'Path\')" /></td>');
s.push('<td><input type="button" value="Browse..." onclick="RefX(\'Path\', false, this, false, \'', api.LoadString(hShell32, 4131), '#*.folder\')" /></td></tr></table><br />');
s.push('<label>Number of items</label><br />');
s.push('<input type="text" name="Items" style="width: 100%" />');
SetTabContents(0, "General", s);

var s = ['<form name="E"><label>Path</label><table class="layout">'];
s.push('<tr><td style="width: 100%"><input type="text" name="Path" style="width: 100%" onchange="Addons.AutoBackup.Changed(this)" /></td>');
s.push('<td><input type="button" value="Browse..." onclick="Addons.AutoBackup.SelectBackup(this)" /></td></tr></table><br />');

s.push('<input type="button" id="Restore" value="@shell32.dll,-24129[-31334]" disabled="true" onclick="Addons.AutoBackup.Restore()" />');
s.push('</form>');
SetTabContents(4, "Restore", s);

Addons.AutoBackup = {
	SelectBackup: function (o)
	{
		var pt = GetPos(o, 9);
		var path = ChooseFolder(api.PathSearchAndQualify(ExtractMacro(te, document.F.Path.value || "%TE_Config%\\..\\backup")), pt);
		if (path) {
			document.E.Path.value = path;
			FireEvent(document.E.Path, "change");
		}
	},

	Changed: function (o)
	{
		document.E.Restore.disabled = te.Version < 20190116 || !fso.FileExists(fso.BuildPath(o.value, "window.xml"));
	},

	Restore: function ()
	{
		if (confirmOk()) {
			MainWindow.g_.strUpdate = ['"', api.IsWow64Process(api.GetCurrentProcess()) ? wsh.ExpandEnvironmentStrings("%SystemRoot%\\Sysnative") : system32, "\\", "wscript.exe", '" "', te.Data.Installed, "\\script\\update.js", '" "', api.GetModuleFileName(null), '" ', api.PathQuoteSpaces(document.E.Path.value), ' "', api.LoadString(hShell32, 12612), '" "" ', api.PathQuoteSpaces(fso.BuildPath(te.Data.DataFolder, "config"))].join("");
			MainWindow.DeleteTempFolder = MainWindow.PerformUpdate;
			api.PostMessage(te.hwnd, WM_CLOSE, 0, 0);
		}
	}
}
