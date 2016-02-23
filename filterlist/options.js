var Addon_Id = "filterlist";

function DialogResize1()
{
	var h = document.documentElement.clientHeight || document.body.clientHeight;
	var i = document.getElementById("buttons").offsetHeight * screen.deviceYDPI / screen.logicalYDPI + 6;
	h -= i > 34 ? i : 34;
	if (h > 0) {
		document.getElementById("panel0").style.height = h + 'px';
	}
};

function Add(ar)
{
	var table = document.getElementById("T");
	var nRows = table.rows.length;
	s = ['<td><input type="radio" name="sel" id="i', nRows, '" /></td>'];
	s.push('<td style="width: 30%"><input type="text" name="n', nRows, '" style="width: 100%" placeholder="Name" title="Name" /></td>');
	s.push('<td style="width: 70%"><input type="text" name="f', nRows, '" style="width: 100%" placeholder="Filter" title="Filter" /></td>');
	var tr = table.insertRow();
	tr.innerHTML = s.join("");
	Set(nRows, ar);
	return tr;
}

function Get(i)
{
	var o = document.F.elements['m' + i];
	return [document.F.elements['n' + i].value, document.F.elements['f' + i].value].join("\t");
}

function Set(i, ar)
{
	if (typeof(ar) == "string") {
		ar = ar.split("\t");
	}
	document.F.elements['n' + i].value = ar[0];
	document.F.elements['f' + i].value = ar[1];
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
} catch (e) {}

ApplyLang(document);
var info = GetAddonInfo(Addon_Id);
document.title = info.Name;
if (document.documentMode < 9) {
	DialogResize1();
	AddEventEx(window, "resize", function ()
	{
		clearTimeout(g_tidResize);
		g_tidResize = setTimeout(function ()
		{
			DialogResize1();
		}, 500);
	});
}
AddEventEx(window, "beforeunload", function ()
{
	SetOptions(function () {
		Save();
		TEOk();
	});
});

function Save()
{
	var table = document.getElementById("T");
	var nRows = table.rows.length;
	try {
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		var empty = ["", ""].join("\t");
		for (var i = 0; i < nRows; i++) {
			var s = Get(i);
			if (s != empty) {
				ado.WriteText(s + "\r\n");
			}
		}
		ado.SaveToFile(fso.BuildPath(te.Data.DataFolder, "config\\" + Addon_Id + ".tsv"), adSaveCreateOverWrite);
		ado.Close();
	}
	catch (e) {
	}
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

function Up()
{
	var nPos = GetIndex();
	if (nPos <= 0) {
		return;
	}
	var s = Get(nPos);
	Set(nPos, Get(nPos - 1));
	Set(--nPos, s);
	document.F.elements["i" + nPos].checked = true;
}

function Down()
{
	var table = document.getElementById("T");
	var nPos = GetIndex();
	if (nPos < 0 || nPos >= table.rows.length - 1) {
		return;
	}
	var s = Get(nPos);
	Set(nPos, Get(nPos + 1));
	Set(++nPos, s);
	document.F.elements["i" + nPos].checked = true;
}

function Remove()
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
