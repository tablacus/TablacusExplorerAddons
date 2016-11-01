if (window.Addon == 1) {
	api.SetDllDirectory(ExtractMacro(te, GetAddonOption("dlldirectory", "x" + (api.sizeof("HANDLE") * 8))));
} else {
	var s = ['<table style="width: 100%"><tr><td><label>32bit</label></td></tr><tr><td><input type="text" name="x32" style="width: 100%" /></td><td><input type="button" value="Browse..." onclick="RefX(\'x32\')" /></td><td><input type="button" value="Portable" onclick="PortableX(\'x32\')" /></td></tr>'];
	s.push('<tr><td style="width: 100%"><label>64bit</label></td></tr><tr><td><input type="text" name="x64" style="width: 100%" /></td><td><input type="button" value="Browse..." onclick="RefX(\'x64\')" /></td><td><input type="button" value="Portable" onclick="PortableX(\'x64\')" /></td></tr></table>');
	SetTabContents(0, "General", s.join(""));
}
