var s = [];
s.push('<div class="panel" style="width: 100%; display: block"><label>Test</label><table><tr><td style="width: 100%"><input type="text" autocomplete="off" onkeyup="KeyUp(this)" style="width: 100%"></td><td><input type="button" value="Refresh" onclick="Refresh()"></td></tr></table>');

s.push('<label>Regular Expression</label><br><input type="text" id="_Migemo" style="width: 100%" readonly></div>');

Addons.CMigemo.Item =
{
	getAttribute: function (s)
	{
		var o = document.F.elements[s];
		return o ? o.value :  null;
	}
}

KeyUp = function (o)
{
	var m;
	if (Addons.CMigemo.Reload) {
		m = Addons.CMigemo.Init(Addons.CMigemo.Item);
		Addons.CMigemo.Reload = false;
		CollectGarbage();
	} else {
		m = window.migemo || (MainWindow.Addons.CMigemo && MainWindow.migemo) || Addons.CMigemo.Init(Addons.CMigemo.Item);
	}
	try {
		document.getElementById("_Migemo").value = m ? m.query(o.value) || o.value : o.value;
	} catch (e) {
		document.getElementById("_Migemo").value = e.description || e.toString();
	}
}

Refresh = function () {
	Addons.CMigemo.Reload = true;
}

for (var i = 32; i <= 64; i += 32) {
	s.push('<div class="panel" style="width: 100%; display: block"><table style="width: 100%"><tr><td style="width: 100%; vertical-align: bottom">migemo.dll (<label>', i, '-bit</label>)</td>');
	s.push('<td><input type="button" value="Portable" onclick="PortableX(\'dll', i, '\')"></td><td><input type="button" value="Browse..." onclick="RefX(\'dll', i, '\', 0, 0, 1, \'*.dll\')"></td></tr></table>');
	s.push('<td><input type="text" name="dll', i, '" style="width: 100%"></div>');

}
s.push('<div class="panel" style="width: 100%; display: block"><table style="width: 100%"><tr><td style="width: 100%; vertical-align: bottom"><label>migemo-dict</label>&emsp;<label>CP</label><input type="text" name="CP" size="6"></td>');
s.push('<td><input type="button" value="Portable" onclick="PortableX(\'dict\')"></td><td><input type="button" value="Browse..." onclick="RefX(\'dict\', 0, 0, 1)"></td></tr></table>');
s.push('<input type="text" name="dict" style="width: 100%"><br>')
s.push('<input type="button" value="UTF-8(CP65001)" onclick="document.F.CP.value=65001"><input type="button" value="SHIFT_JIS(CP932)" onclick="document.F.CP.value=932"></div>');
s.push('<br><input type="button" value="', api.sprintf(999, GetText("Get %s..."), "C/Migemo"), '" title="http://www.kaoriya.net/software/cmigemo/" onclick="wsh.Run(this.title)">');
SetTabContents(0, "", s.join(""));