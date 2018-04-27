SetTabContents(4, "Color",'<form name="E" id="data1"><table id="T" style="width: 100%"></table></form>');
document.getElementById("toolbar").innerHTML = '<input type="button" value="Add" onclick=\'Add(["",""])\' />&emsp;<input type="button" value="Up" onclick="Up()" /><input type="button" value="Down" onclick="Down()" />&emsp;<input type="button" value="Remove" onclick="Remove()" />';

ConfigTSV = fso.BuildPath(te.Data.DataFolder, "config\\" + Addon_Id + ".tsv");

Get = function (i)
{
	return [document.E.elements['p' + i].value, document.E.elements['c' + i].value];
}

Set = function (i, ar)
{
	document.E.elements['p' + i].value = ar[0];
	document.E.elements['c' + i].value = ar[1];
	document.E.elements['b' + i].style.backgroundColor = ar[1];
}

Add = function(ar)
{
	var table = document.getElementById("T");
	var nRows = table.rows.length;
	s = ['<td style="width: 1em"><input type="radio" name="sel" id="i', nRows, '" /></td>'];
	s.push('<td><input type="text" name="p', nRows, '" style="width: 100%" onchange="FilterChanged(this)" placeholder="', hint, '" title="', hint ,'" /></td>');
	var cl = GetText("Color");
	s.push('<td style="width: 7em"><input type="text" name="c', nRows, '" style="width: 100%" placeholder="', cl, '" title="', cl, '" onchange="FilterChanged()"  /></td>');
	s.push('<td style="width: 1em"><input type="button" name="b', nRows, '" value=" " class="color" style="width: 100%" onclick="ChooseColor2(this)" title="', cl, '" /></td>');
	var tr = table.insertRow();
	tr.innerHTML = s.join("");
	Set(nRows, ar);
	return tr;
}


function GetIndex()
{
	var table = document.getElementById("T");
	for (var i = table.rows.length; i--;) {
		if (document.getElementById("i" + i).checked) {
			return i;
		}
	}
	return -1;
}

Up = function ()
{
	var nPos = GetIndex();
	if (nPos <= 0) {
		return;
	}
	var s = Get(nPos);
	Set(nPos, Get(nPos - 1));
	Set(--nPos, s);
	document.E.elements["i" + nPos].checked = true;
}

Down = function ()
{
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

Remove = function ()
{
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

FilterChanged = function(o)
{
	g_bChanged = true;
}

ChangeColor = function(o)
{
	var n = o.name.replace(/\D/, "");
	document.E.elements["b" + n].style.backgroundColor = o.value;
	g_bChanged = true;
}

ChooseColor2 = function(o)
{
	var n = o.name.replace(/\D/, "");
	var oc = document.E.elements["c" + n];
	var c = ChooseWebColor(oc.value);
	if (c) {
		oc.value = c;
		ChangeColor(oc);
	}
}

SaveLocation = function ()
{
	try {
		var ado = api.CreateObject("ads");
		ado.CharSet = "utf-8";
		ado.Open();
		var table = document.getElementById("T");
		var nRows = table.rows.length;
		for (var i = 0; i < nRows; i++) {
			ado.WriteText([document.E.elements['p' + i].value, document.E.elements['c' + i].value].join("\t") + "\r\n");
		}
		ado.SaveToFile(ConfigTSV, adSaveCreateOverWrite);
		ado.Close();
	} catch (e) {}
}

try {
	var ado = OpenAdodbFromTextFile(ConfigTSV);
	while (!ado.EOS) {
		var ar = ado.ReadText(adReadLine).split("\t");
		Add(ar);
	}
	ado.Close();
} catch (e) {}
