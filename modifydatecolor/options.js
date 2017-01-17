SetTabContents(4, "Color",'<form name="E" id="data1"><table id="T" style="width: 100%"></table></form>');
document.getElementById("toolbar").innerHTML = '<input type="button" value="Add" onclick=\'Add(["",""])\' />&emsp;<input type="button" value="Up" onclick="Up()" /><input type="button" value="Down" onclick="Down()" />&emsp;<input type="button" value="Remove" onclick="Remove()" />';

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
	s.push('<td><input type="text" name="p', nRows, '" style="width: 100%" onchange="FilterChanged(this)" placeholder="time 1s 1m 1h 1d 1w 1y" title="time 1s 1m 1h 1d 1w 1y" /></td>');
	s.push('<td style="width: 7em"><input type="text" name="c', nRows, '" style="width: 100%" placeholder="Color" title="Color" onchange="FilterChanged()"  /></td>');
	s.push('<td style="width: 1em"><input type="button" name="b', nRows, '" value=" " class="color" style="width: 100%" onclick="ChooseColor2(this)" title="Color" /></td>');
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
//		try {
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		var table = document.getElementById("T");
		var nRows = table.rows.length;
		for (var i = 0; i < nRows; i++) {
			ado.WriteText([document.E.elements['p' + i].value, document.E.elements['c' + i].value].join("\t") + "\r\n");
		}
		ado.SaveToFile(fso.BuildPath(te.Data.DataFolder, "config\\modifydatecolor.tsv"), adSaveCreateOverWrite);
		ado.Close();
//		} catch (e) {}
}

//	try {
	var ado = te.CreateObject("Adodb.Stream");
	ado.CharSet = "utf-8";
	ado.Open();
	ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\modifydatecolor.tsv"));
	while (!ado.EOS) {
		var ar = ado.ReadText(adReadLine).split("\t");
		Add(ar);
	}
	ado.Close();
//	} catch (e) {}
