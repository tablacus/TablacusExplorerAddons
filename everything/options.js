var s = ['<table style="width: 100%"><tr><td><label>Width</label></td></tr><tr><td><input type="text" name="Width" size="10"></td><td><input type="button" value="Default" onclick="document.F.Width.value=\'\'"></td></tr>'];
s.push('<tr><td><label>Action</label></td></tr>');
s.push('<tr><td><input type="checkbox" id="NewTab"><label for="NewTab">Open in New Tab</label>&emsp;<input type="checkbox" id="RE"><label for="RE">Regular Expression</label>/<label for="RE">Migemo</label>&emsp;<input type="checkbox" id="Subfolders"><label for="Subfolders">@shell32.dll,-23357[Subfolders]</label></td></tr>');
s.push('<tr><td style="width: 100%"><label>Number of items</label></td></tr><tr><td><input type="text" name="Folders" size="10"></td><td><input type="button" value="Default" onclick="document.F.Folders.value=1000"></td></tr>');
s.push('<tr><td style="width: 100%"><label>Exec</label></td></tr><tr><td><input type="text" name="Exec" style="width: 100%"></td><td><input type="button" value="Browse..." onclick="RefX(\'Exec\',0,0,1)"></td><td><input type="button" value="Default" onclick="SetExe()"></td></tr></table>');
s.push('<br><br><input type="button" value="', api.sprintf(999, GetText("Get %s..."), "Everything"), '" title="http://www.voidtools.com/" onclick="wsh.Run(this.title)">');
SetTabContents(0, "General", s.join(""));

SetExe = function ()
{
	var path = fso.BuildPath(api.GetDisplayNameOf(ssfPROGRAMFILES, SHGDN_FORPARSING), "Everything\\Everything.exe");
	if (!fso.FileExists(path)) {
		path = path.replace(/ \(x86\)\\/, "\\");
	}
	if (fso.FileExists(path) && confirmOk("Are you sure?")) {
		document.F.Exec.value = api.PathQuoteSpaces(path) + " -startup";
	}
}