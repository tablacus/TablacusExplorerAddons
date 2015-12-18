Addon_Id = "labelgroups";

if (window.Addon == 1) {
	Addons.LabelGroups = {db: {}};
	try {
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\labelgroups.tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[1] != "") {
				Addons.LabelGroups.db[ar[0]] = ar[1].split(/\s*;\s*/);
			}
		}
		ado.Close();
	}
	catch (e) {
	}

}
else {
	g_nLast = 0;
	document.getElementById("tab4").value = GetText("General");
	document.getElementById("panel4").innerHTML = '<form name="E" id="data1"></form>';
	AddGroup = function(strPath, strLabel)
	{
		s = ['<table style="width: 100%"><tr><td><input type="text" name="p', g_nLast, '" value="', strPath, '" style="width: 10em" onchange="FilterChanged(this)" placeholder="Name" title="Name" /></td>'];
		s.push('<td style="width: 100%"><input type="text" name="c', g_nLast, '" value="', strLabel, '"  style="width: 100%" placeholder="Label" title="Label" onchange="FilterChanged()"  /></td>');
		s.push('<td style="width: 1em"><input type="button" name="b', g_nLast, '" value="..."  onclick="AddLabel(this)" title="Browse" /></td>');
		s.push('</tr></table>');
		var o = document.getElementById("data1");
		o.insertAdjacentHTML("BeforeEnd", s.join(""));
		ApplyLang(o);
		g_nLast++;
	}

	FilterChanged = function(o)
	{
		g_bChanged = true;
		if (o && o.name.replace(/\D/, "") == g_nLast - 1) {
			AddGroup("", "");
		}
	}

	AddLabel = function(o)
	{
		if (MainWindow.Addons.Label) {
			var oc = document.E.elements["c" + o.name.replace(/\D/, "")];
			var hMenu = api.CreatePopupMenu();
			var oList = {};
			MainWindow.Addons.Label.List(oList);
			var nPos = 0;
			for (var s in oList) {
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, s);
			}
			var pt = GetPos(o, true);
			var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y + o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI, te.hwnd, null, null);
			if (nVerb) {
				var ar = oc.value.split(/\s*;\s/);
				ar.push(api.GetMenuString(hMenu, nVerb, MF_BYCOMMAND));
				for (var i = ar.length; i--;) {
					if (ar[i] == "") {
						ar.splice(i, 1);
					}
				}
				oc.value = ar.join(";");
			}
			api.DestroyMenu(hMenu);
		}
	}

	SaveLocation = function ()
	{
		try {
			var ado = te.CreateObject("Adodb.Stream");
			ado.CharSet = "utf-8";
			ado.Open();
			for (var i = 0; i < g_nLast; i++) {
				var s = document.E.elements['p' + i].value;
				if (s != "") {
					ado.WriteText([s, document.E.elements['c' + i].value].join("\t") + "\r\n");
				}
			}
			ado.SaveToFile(fso.BuildPath(te.Data.DataFolder, "config\\labelgroups.tsv"), adSaveCreateOverWrite);
			ado.Close();
		}
		catch (e) {
		}
	}

	try {
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\labelgroups.tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			AddGroup(ar[0], ar[1]);
		}
		ado.Close();
	}
	catch (e) {
	}
	AddGroup("", "");
}
