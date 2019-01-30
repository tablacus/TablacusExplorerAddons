Addons.FilterList = {
	Add: function (ar)
	{
		var table = document.getElementById("T");
		var nRows = table.rows.length;
		s = ['<td><input type="radio" name="sel" id="i', nRows, '" /></td>'];
		s.push('<td style="width: 30%"><input type="text" name="n', nRows, '" style="width: 100%" placeholder="Name" title="Name" /></td>');
		s.push('<td style="width: 70%"><input type="text" name="f', nRows, '" style="width: 100%" placeholder="Filter" title="Filter" /></td>');
		var tr = table.insertRow();
		tr.innerHTML = s.join("");
		Addons.FilterList.Set(nRows, ar);
		return tr;
	},

	Get: function (i)
	{
		return [document.E.elements['n' + i].value, document.E.elements['f' + i].value].join("\t");
	},

	Set: function (i, ar)
	{
		if (typeof(ar) == "string") {
			ar = ar.split("\t");
		}
		document.E.elements['n' + i].value = ar[0];
		document.E.elements['f' + i].value = ar[1];
	},

	GetIndex: function ()
	{
		var table = document.getElementById("T");
		for (var i = table.rows.length; i--;) {
			if (document.getElementById("i" + i).checked) {
				return i;
			}
		}
		return -1;
	},

	Up: function ()
	{
		var nPos = Addons.FilterList.GetIndex();
		if (nPos <= 0) {
			return;
		}
		var s = Addons.FilterList.Get(nPos);
		Addons.FilterList.Set(nPos, Addons.FilterList.Get(nPos - 1));
		Addons.FilterList.Set(--nPos, s);
		document.E.elements["i" + nPos].checked = true;
	},

	Down: function ()
	{
		var table = document.getElementById("T");
		var nPos = Addons.FilterList.GetIndex();
		if (nPos < 0 || nPos >= table.rows.length - 1) {
			return;
		}
		var s = Addons.FilterList.Get(nPos);
		Addons.FilterList.Set(nPos, Addons.FilterList.Get(nPos + 1));
		Addons.FilterList.Set(++nPos, s);
		document.E.elements["i" + nPos].checked = true;
	},

	Remove: function ()
	{
		var nPos = Addons.FilterList.GetIndex();
		if (nPos < 0 || !confirmOk("Are you sure?")) {
			return;
		}
		var table = document.getElementById("T");
		var nRows = table.rows.length;
		for (var i = nPos; i < nRows - 1; i++) {
			Addons.FilterList.Set(i, Addons.FilterList.Get(i + 1));
		}
		table.deleteRow(nRows - 1);
	},

	Resize: function ()
	{
		var h = document.documentElement.clientHeight || document.body.clientHeight;
		var i = (g_.Inline ? 70 : 99) * screen.deviceYDPI / screen.logicalYDPI;
		h -= i > 34 ? i : 34;
		if (h > 0) {
			document.getElementById("panel0f").style.height = h + 'px';
		}
	}
}

var ado = OpenAdodbFromTextFile(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\" + Addon_Id + "\\options.html"));
if (ado) {
	var ar = ado.ReadText(adReadAll).split("<!--panel-->");
	SetTabContents(0, "View", ar[0]);
	SetTabContents(4, "General", ar[1]);
	ado.Close();
}

AddEventEx(window, "load", function ()
{
	try {

		var o;
		for (var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\" + Addon_Id + ".tsv")); !ado.EOS;) {
			o = Addons.FilterList.Add(ado.ReadText(adReadLine));
		}
		ado.Close();
		if (o) {
			ApplyLang(o);
		}
	} catch (e) {}

	if (document.documentMode < 9 || true) {
		Addons.FilterList.Resize();
		AddEventEx(window, "resize", function ()
		{
			clearTimeout(Addons.FilterList.tid);
			Addons.FilterList.tid = setTimeout(Addons.FilterList.Resize, 99);
		});
	}
});

SaveLocation = function()
{
	var table = document.getElementById("T");
	var nRows = table.rows.length;
	try {
		var ado = te.CreateObject(api.ADBSTRM);
		ado.CharSet = "utf-8";
		ado.Open();
		var empty = ["", ""].join("\t");
		for (var i = 0; i < nRows; i++) {
			var s = Addons.FilterList.Get(i);
			if (s != empty) {
				ado.WriteText(s + "\r\n");
			}
		}
		ado.SaveToFile(fso.BuildPath(te.Data.DataFolder, "config\\" + Addon_Id + ".tsv"), adSaveCreateOverWrite);
		ado.Close();
	} catch (e) {}
}