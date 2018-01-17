var ado = OpenAdodbFromTextFile(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\" + Addon_Id + "\\options.html"));
if (ado) {
	var ar = ado.ReadText(adReadAll).split("<!--panel-->");
	SetTabContents(0, "View", ar[0]);
	SetTabContents(4, "General", ar[1]);
	ado.Close();
}

AddFL = function (ar)
{
	var table = document.getElementById("T");
	var nRows = table.rows.length;
	s = ['<td><input type="radio" name="sel" id="i', nRows, '" /></td>'];
	s.push('<td style="width: 30%"><input type="text" name="n', nRows, '" style="width: 100%" placeholder="Name" title="Name" /></td>');
	s.push('<td style="width: 70%"><input type="text" name="f', nRows, '" style="width: 100%" placeholder="Filter" title="Filter" /></td>');
	var tr = table.insertRow();
	tr.innerHTML = s.join("");
	SetFL(nRows, ar);
	return tr;
}

GetFL = function (i)
{
	var o = document.E.elements['m' + i];
	return [document.E.elements['n' + i].value, document.E.elements['f' + i].value].join("\t");
}

SetFL = function (i, ar)
{
	if (typeof(ar) == "string") {
		ar = ar.split("\t");
	}
	document.E.elements['n' + i].value = ar[0];
	document.E.elements['f' + i].value = ar[1];
}

GetIndexFL = function ()
{
	var table = document.getElementById("T");
	for (var i = table.rows.length; i--;) {
		if (document.getElementById("i" + i).checked) {
			return i;
		}
	}
	return -1;
}

UpFL = function ()
{
	var nPos = GetIndexFL();
	if (nPos <= 0) {
		return;
	}
	var s = GetFL(nPos);
	SetFL(nPos, GetFL(nPos - 1));
	SetFL(--nPos, s);
	document.E.elements["i" + nPos].checked = true;
}

DownFL = function ()
{
	var table = document.getElementById("T");
	var nPos = GetIndexFL();
	if (nPos < 0 || nPos >= table.rows.length - 1) {
		return;
	}
	var s = GetFL(nPos);
	SetFL(nPos, GetFL(nPos + 1));
	SetFL(++nPos, s);
	document.E.elements["i" + nPos].checked = true;
}

RemoveFL = function ()
{
	var nPos = GetIndexFL();
	if (nPos < 0 || !confirmOk("Are you sure?")) {
		return;
	}
	var table = document.getElementById("T");
	var nRows = table.rows.length;
	for (var i = nPos; i < nRows - 1; i++) {
		SetFL(i, GetFL(i + 1));
	}
	table.deleteRow(nRows - 1);
}

function DialogResize1()
{
	var h = document.documentElement.clientHeight || document.body.clientHeight;
	var i = 70 * screen.deviceYDPI / screen.logicalYDPI;
	h -= i > 34 ? i : 34;
	if (h > 0) {
		document.getElementById("panel0f").style.height = h + 'px';
	}
};

AddEventEx(window, "load", function ()
{
	try {
		var ado = te.CreateObject(api.ADBSTRM);
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\" + Addon_Id + ".tsv"));
		var o;
		while (!ado.EOS) {
			o = AddFL(ado.ReadText(adReadLine));
		}
		ado.Close();
		if (o) {
			ApplyLang(o);
		}
	} catch (e) {}

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
});

SaveLocation = function()
{

	var table = document.getElementById("T");
	var nRows = table.rows.length;
//	try {
		var ado = te.CreateObject(api.ADBSTRM);
		ado.CharSet = "utf-8";
		ado.Open();
		var empty = ["", ""].join("\t");
		for (var i = 0; i < nRows; i++) {
			var s = GetFL(i);
			if (s != empty) {
				ado.WriteText(s + "\r\n");
			}
		}
		ado.SaveToFile(fso.BuildPath(te.Data.DataFolder, "config\\" + Addon_Id + ".tsv"), adSaveCreateOverWrite);
		ado.Close();
//	} catch (e) {}
}