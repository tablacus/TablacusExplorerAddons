
let ar = (await ReadTextFile(BuildPath("addons", Addon_Id, "options.html"))).split("<!--toolbar-->");
SetTabContents(4, "", ar[0]);
document.getElementById("toolbar").innerHTML = ar[1];

g_arMenuTypes = ["Default", "Context", "Background", "Tabs", "Tree", "File", "Edit", "View", "Favorites", "Tools", "Help", "Systray", "System", "Alias"];

Add = function (ar) {
	const table = document.getElementById("T");
	const nRows = table.rows.length;
	s = ['<td><input type="radio" name="sel" id="i', nRows, '"></td>'];
	s.push('<td><select name="m', nRows, '" class="translate"><option value="">Select</option>');
	for (let j in g_arMenuTypes) {
		const s1 = g_arMenuTypes[j];
		s.push('<option value="', s1, '">', s1, '</option>');
	}
	s.push('</select></td>');
	s.push('<td style="width: 60%"><input type="text" name="p', nRows, '" style="width: 100%" placeholder="Path" title="Path"></td>');
	s.push('<td style="width: 40%"><input type="text" name="f', nRows, '" style="width: 100%" placeholder="Filter" title="Filter"></td>');
	s.push('<td><input type="button" value="Browse..." onclick="BrowseFilter(this, ', nRows, ')"></td>');
	const tr = table.insertRow();
	tr.innerHTML = s.join("");
	Set(nRows, ar);
}

Get = function (i) {
	const o = document.E.elements['m' + i];
	return [o[o.selectedIndex].value, document.E.elements['p' + i].value, document.E.elements['f' + i].value].join("\t");
}

Set = function (i, ar) {
	if ("string" === typeof ar) {
		ar = ar.split("\t");
	}
	const o = document.E.elements['m' + i];
	for (let j = o.length; j--;) {
		if (o[j].value == ar[0]) {
			o.selectedIndex = j;
			break;
		}
	}
	document.E.elements['p' + i].value = ar[1] || "*";
	document.E.elements['f' + i].value = ar[2] || "";
}

BrowseFilter = function (o, n) {
	setTimeout(async function () {
		const m = document.E.elements["m" + n].selectedIndex;
		if (m) {
			const pt = await GetPosEx(o, 9);
			if (await MainWindow.ExecMenu(te, g_arMenuTypes[m - 1], pt, 0, true) == S_OK) {
				document.E.elements["f" + n].value = (await MainWindow.g_menu_string).replace(/\t/g, "|");
			}
		}
	}, 99);
}

GetIndex = function () {
	const table = document.getElementById("T");
	for (let i = table.rows.length; i--;) {
		if (document.getElementById("i" + i).checked) {
			return i;
		}
	}
	return -1;
}

Up = function () {
	let nPos = GetIndex();
	if (nPos <= 0) {
		return;
	}
	const s = Get(nPos);
	Set(nPos, Get(nPos - 1));
	Set(--nPos, s);
	document.E.elements["i" + nPos].checked = true;
}

Down = function () {
	const table = document.getElementById("T");
	let nPos = GetIndex();
	if (nPos < 0 || nPos >= table.rows.length - 1) {
		return;
	}
	const s = Get(nPos);
	Set(nPos, Get(nPos + 1));
	Set(++nPos, s);
	document.E.elements["i" + nPos].checked = true;
}

Remove = async function () {
	const nPos = GetIndex();
	if (nPos < 0 || !await confirmOk()) {
		return;
	}
	const table = document.getElementById("T");
	const nRows = table.rows.length;
	for (let i = nPos; i < nRows - 1; i++) {
		Set(i, Get(i + 1));
	}
	table.deleteRow(nRows - 1);
}

SaveLocation = async function () {
	const table = document.getElementById("T");
	const nRows = table.rows.length;
	const ar = [];
	const empty = ["", "", ""].join("\t");
	const empty2 = ["", "*", ""].join("\t");
	for (let i = 0; i < nRows; i++) {
		const s = Get(i);
		if (s != empty && s != empty2) {
			ar.push(s);
		}
	}
	await WriteTextFile(BuildPath(ui_.DataFolder, "config", Addon_Id + ".tsv"), ar.join("\r\n"));
}

ar = (await ReadTextFile(BuildPath(ui_.DataFolder, "config", Addon_Id + ".tsv"))).split(/\r?\n/);
let s;
while (s = ar.shift()) {
	Add(s);
}
