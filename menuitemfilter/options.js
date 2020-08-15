var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	var ar = ado.ReadText(adReadAll).split("<!--toolbar-->");
	SetTabContents(4, "", ar[0]);
	ado.Close();
	document.getElementById("toolbar").innerHTML = ar[1];
}

g_arMenuTypes = ["Default", "Context", "Background", "Tabs", "Tree", "File", "Edit", "View", "Favorites", "Tools", "Help", "Systray", "System", "Alias"];

Add = function (ar) {
	var table = document.getElementById("T");
	var nRows = table.rows.length;
	s = ['<td><input type="radio" name="sel" id="i', nRows, '" /></td>'];
	s.push('<td><select name="m', nRows, '"><option value="">Select</option>');
	for (var j in g_arMenuTypes) {
		var s1 = g_arMenuTypes[j];
		s.push('<option value="', s1, '">', s1, '</option>');
	}
	s.push('</select></td>');
	s.push('<td style="width: 60%"><input type="text" name="p', nRows, '" style="width: 100%" placeholder="Path" title="Path" /></td>');
	s.push('<td style="width: 40%"><input type="text" name="f', nRows, '" style="width: 100%" placeholder="Filter" title="Filter" /></td>');
	s.push('<td><input type="button" value="Browse..." onclick="BrowseFilter(this, ', nRows, ')" /></td>');
	var tr = table.insertRow();
	tr.innerHTML = s.join("");
	Set(nRows, ar);
	return tr;
}

Get = function (i) {
	var o = document.E.elements['m' + i];
	return [o[o.selectedIndex].value, document.E.elements['p' + i].value, document.E.elements['f' + i].value].join("\t");
}

Set = function (i, ar) {
	if ("string" === typeof ar) {
		ar = ar.split("\t");
	}
	var o = document.E.elements['m' + i];
	for (var j = o.length; j--;) {
		if (o[j].value == ar[0]) {
			o.selectedIndex = j;
			break;
		}
	}
	document.E.elements['p' + i].value = ar[1];
	document.E.elements['f' + i].value = ar[2];
}

BrowseFilter = function (o, n) {
	setTimeout(function () {
		var m = document.E.elements["m" + n].selectedIndex;
		if (m) {
			var pt = GetPos(o, true);
			pt.y = pt.y + o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI;
			if (MainWindow.ExecMenu(te, g_arMenuTypes[m - 1], pt, 0, true) == S_OK) {
				document.E.elements["f" + n].value = MainWindow.g_menu_string.replace(/\t/g, "|");
			}
		}
	}, 99);
}

GetIndex = function () {
	var table = document.getElementById("T");
	for (var i = table.rows.length; i--;) {
		if (document.getElementById("i" + i).checked) {
			return i;
		}
	}
	return -1;
}

Up = function () {
	var nPos = GetIndex();
	if (nPos <= 0) {
		return;
	}
	var s = Get(nPos);
	Set(nPos, Get(nPos - 1));
	Set(--nPos, s);
	document.E.elements["i" + nPos].checked = true;
}

Down = function () {
	var table = document.getElementById("T");
	var nPos = GetIndex();
	if (nPos < 0 || nPos >= table.rows.length - 1) {
		return;
	}
	var s = Get(nPos);
	Set(nPos, Get(nPos + 1));
	Set(++nPos, s);
	document.E.elements["i" + nPos].checked = true;
}

Remove = function () {
	var nPos = GetIndex();
	if (nPos < 0 || !confirmOk("Are you sure?")) {
		return;
	}
	var table = document.getElementById("T");
	var nRows = table.rows.length;
	for (var i = nPos; i < nRows - 1; i++) {
		Set(i, Get(i + 1));
	}
	table.deleteRow(nRows - 1);
}

SaveLocation = function () {
	var table = document.getElementById("T");
	var nRows = table.rows.length;
	try {
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		var empty = ["", "", ""].join("\t");
		var empty2 = ["", "*", ""].join("\t");
		for (var i = 0; i < nRows; i++) {
			var s = Get(i);
			if (s != empty && s != empty2) {
				ado.WriteText(s + "\r\n");
			}
		}
		ado.SaveToFile(fso.BuildPath(te.Data.DataFolder, "config\\" + Addon_Id + ".tsv"), adSaveCreateOverWrite);
		ado.Close();
	}
	catch (e) {
	}
}

try {
	var ado = te.CreateObject("Adodb.Stream");
	ado.CharSet = "utf-8";
	ado.Open();
	ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\" + Addon_Id + ".tsv"));
	var o;
	while (!ado.EOS) {
		o = Add(ado.ReadText(adReadLine));
	}
	ado.Close();
	if (o) {
		ApplyLang(o);
	}
} catch (e) { }

