SetTabContents(4, "Color", '<form name="E" id="data1"><table id="T" class="full"></table></form>');
document.getElementById("toolbar").innerHTML = '<button onclick=\'Add(["",""])\'>Add</button>&emsp;<button onclick="Up()">Up</button><button onclick="Down()">Down</button>&emsp;<button onclick="Remove()">Remove</button>';

const r = await Promise.all([te.Data.DataFolder, GetTextR("@oleaccrc.dll,-4042"), GetTextR("@oleaccrc.dll,-4043"), GetText("Filter")]);
ConfigTSV = BuildPath(r[0], "config", Addon_Id + ".tsv");
const g_strColor = r[1];
const g_strFColor = r[2];
const hint = r[3];

Get = function (i) {
	return [document.E['p' + i].value, document.E['c' + i].value, document.E['f' + i].value];
}

Set = function (i, ar) {
	document.E['p' + i].value = ar[0] || "";
	document.E['c' + i].value = ar[1] || "";
	document.E['b' + i].style.backgroundColor = ar[1] || "";
	document.E['f' + i].value = ar[2] || "";
	document.E['e' + i].style.backgroundColor = ar[2] || "";
}

Add = function (ar) {
	if (ar.length < 2) {
		return;
	}
	const table = document.getElementById("T");
	const nRows = table.rows.length;
	s = ['<td style="width: 1em"><input type="radio" name="sel" id="i', nRows, '"></td>'];
	s.push('<td><input type="text" name="p', nRows, '" class="full" onchange="FilterChanged(this)" placeholder="', hint, '" title="', hint, '"></td>');
	s.push('<td style="width: 7em"><input type="text" name="c', nRows, '" class="full" placeholder="', g_strColor, '" title="', g_strColor, '" onchange="ChangeColor(this)" ></td>');
	s.push('<td style="width: 1em"><button name="b', nRows, '" class="color full" onclick="ChooseColor2(this)" title="', g_strColor, '">&ensp;</button></td>');
	s.push('<td style="width: 7em"><input type="text" name="f', nRows, '" class="full" placeholder="', g_strFColor, '" title="', g_strFColor, '" onchange="ChangeColor(this, true)" ></td>');
	s.push('<td style="width: 1em"><button name="e', nRows, '" class="color full" onclick="ChooseColor2(this, true)" title="', g_strFColor, '">&ensp;</button></td>');
	const tr = table.insertRow();
	tr.innerHTML = s.join("");
	Set(nRows, ar);
	return tr;
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
	document.E["i" + nPos].checked = true;
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
	document.E["i" + nPos].checked = true;
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

FilterChanged = function (o) {
	g_bChanged = true;
}

ChangeColor = function (o, f) {
	const n = o.name.replace(/\D/, "");
	document.E[(f ? "e" : "b") + n].style.backgroundColor = o.value;
	g_bChanged = true;
}

ChooseColor2 = async function (o, f) {
	const n = o.name.replace(/\D/, "");
	const oc = document.E[(f ? "f" : "c") + n];
	const c = await ChooseWebColor(oc.value);
	if (c) {
		oc.value = c;
		ChangeColor(oc, f);
	}
}

SaveLocation = async function () {
	try {
		const ado = await api.CreateObject("ads");
		ado.CharSet = "utf-8";
		await ado.Open();
		const table = document.getElementById("T");
		const nRows = table.rows.length;
		let data = "";
		for (let i = 0; i < nRows; i++) {
			data += Get(i).join("\t") + "\r\n";
		}
		await ado.WriteText(data);
		await ado.SaveToFile(ConfigTSV, adSaveCreateOverWrite);
		ado.Close();
	} catch (e) { }
}

for (let data = (await ReadTextFile(ConfigTSV)).split(/\r?\n/); data.length;) {
	Add(data.shift().split("\t"));
}

window.OnTabChanged = function (i) {
	document.getElementById("toolbar").style.visibility = i == 4 ? "" : "hidden";
}
