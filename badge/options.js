let s = ['<table style="width: 100%">'];
for (let i = 1; i <= 5; i++) {
	s.push('<tr><td><label>', i, '</label></td></tr><tr><td style="width: 100%"><input type="text" name="Img', i, '" style="width: 100%"></td><td><input type="button" value="Browse..." onclick="RefX(\'Img', i, '\')"></td><td><input type="button" value="Portable" onclick="PortableX(\'Img', i, '\')"></td></tr>');
}
s.push('</table>');
SetTabContents(0, (await api.LoadString(hShell32, 9007) || "Image").replace(/#.*/, ""), s);
s = [];
s.push('<label><input type="checkbox" id="Portable">Portable</label><br>');
s.push('<label><input type="checkbox" id="Bottom">Bottom</label>');
SetTabContents(1, "General", s);
