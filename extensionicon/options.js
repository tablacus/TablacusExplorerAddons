SetTabContents(4, "General",'<form name="E" id="data1"><table id="T" style="width: 100%"></table></form>');
document.getElementById("toolbar").innerHTML = '<input type="button" value="Add" onclick=\'Add(["",""])\' />&emsp;<input type="button" value="Up" onclick="Up()" /><input type="button" value="Down" onclick="Down()" />&emsp;<input type="button" value="Remove" onclick="Remove()" />';

Get = function (i)
{
	return [document.E.elements['p' + i].value, document.E.elements['c' + i].value];
}

Set = function (i, ar)
{
	document.E.elements['p' + i].value = ar[0];
	document.E.elements['c' + i].value = ar[1];
	var image = Addons.ExtensionIcon.GetIconImage(ar[1]);
	if (image) {
		document.getElementById('icon_' + i).src = image.DataURI("image/png");
	}
}

Add = function(ar)
{
	var table = document.getElementById("T");
	var nRows = table.rows.length;
	s = ['<td style="width: 1em"><input type="radio" name="sel" id="i', nRows, '" /></td>'];
	var cl = "Extension";
	s.push('<td><input type="text" name="p', nRows, '" style="width: 100%" onchange="FilterChanged(this)" placeholder="', cl, '" title="', cl, '" /></td>');
	cl = GetText("Icon");
	s.push('<td><img id="icon_', nRows, '" style="width: ', api.GetSystemMetrics(SM_CXSMICON) ,'px; height: ', api.GetSystemMetrics(SM_CYSMICON) ,'px"></td>')
	s.push('<td style="width: 70%"><input type="text" name="c', nRows, '" style="width: 100%" placeholder="', cl, '" title="', cl, '" onchange="IconChanged(this)" /></td>');
	s.push('<td><input type="button" name="b', nRows, '" value="', GetText("Browse..."), '" onclick="ChooseIcon(this)" title="', cl, '" /></td>');
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

IconChanged = function(o)
{
	var n = o.name.replace(/\D/, "");
	Set(n, Get(n));
	g_bChanged = true;
}

ChooseIcon = function(o)
{
	var n = o.name.replace(/\D/, "");
	var oc = document.E.elements["c" + n];
	var s = OpenDialogEx(oc.value, api.LoadString(hShell32, 9007), true);
	if (s) {
		oc.value = s;
		FireEvent(oc, "change");
	}
}

SaveLocation = function ()
{
	try {
		var ado = new ActiveXObject(api.ADBSTRM);
		ado.CharSet = "utf-8";
		ado.Open();
		var table = document.getElementById("T");
		var nRows = table.rows.length;
		for (var i = 0; i < nRows; i++) {
			ado.WriteText([document.E.elements['p' + i].value, document.E.elements['c' + i].value].join("\t") + "\r\n");
		}
		ado.SaveToFile(fso.BuildPath(te.Data.DataFolder, "config\\extensionicon.tsv"), adSaveCreateOverWrite);
		ado.Close();
	} catch (e) {}
}

try {
	var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\extensionicon.tsv"));
	while (!ado.EOS) {
		var ar = ado.ReadText(adReadLine).split("\t");
		Add(ar);
	}
	ado.Close();
} catch (e) {}
