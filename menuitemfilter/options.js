
var ar = (await ReadTextFile("addons\\" + Addon_Id + "\\options.html")).split("<!--toolbar-->");
SetTabContents(4, "", ar[0]);
document.getElementById("toolbar").innerHTML = ar[1];

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
	setTimeout(async function () {
		var m = document.E.elements["m" + n].selectedIndex;
		if (m) {
			var pt = await GetPosEx(o, 9);
			if (await MainWindow.ExecMenu(te, g_arMenuTypes[m - 1], pt, 0, true) == S_OK) {
				document.E.elements["f" + n].value = (await MainWindow.g_menu_string).replace(/\t/g, "|");
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

Remove = async function () {
	var nPos = GetIndex();
	if (nPos < 0 || !await confirmOk()) {
		return;
	}
	var table = document.getElementById("T");
	var nRows = table.rows.length;
	for (var i = nPos; i < nRows - 1; i++) {
		Set(i, Get(i + 1));
	}
	table.deleteRow(nRows - 1);
}

SaveLocation = async function () {
	var table = document.getElementById("T");
	var nRows = table.rows.length;
	debugger;

//	try {
		var ado = await api.CreateObject("ads");
		ado.CharSet = "utf-8";
		await ado.Open();
		var empty = ["", "", ""].join("\t");
		var empty2 = ["", "*", ""].join("\t");
		for (var i = 0; i < nRows; i++) {
			var s = Get(i);
			if (s != empty && s != empty2) {
				await ado.WriteText(s + "\r\n");
			}
		}
		await ado.SaveToFile(BuildPath(await te.Data.DataFolder, "config", Addon_Id + ".tsv"), adSaveCreateOverWrite);
		ado.Close();
//	} catch (e) { }
}

try {
	var ado = await api.CreateObject("ads");
	ado.CharSet = "utf-8";
	ado.Open();
	ado.LoadFromFile(BuildPath(await te.Data.DataFolder, "config", Addon_Id + ".tsv"));
	var o;
	while (!await ado.EOS) {
		o = Add(await ado.ReadText(adReadLine));
	}
	ado.Close();
	if (o) {
		ApplyLang(o);
	}
} catch (e) { }

