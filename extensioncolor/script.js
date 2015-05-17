Addon_Id = "extensioncolor";
Default = "None";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
}
if (window.Addon == 1) {
	Addons.ExtensionColor = {
		Color: {},
		nPos: 0,
		strName: "Extension color",
		Enabled: true,

		Exec: function ()
		{
			Addons.ExtensionColor.Enabled = !Addons.ExtensionColor.Enabled;
			api.RedrawWindow(te.hwnd, null, 0, RDW_NOERASE | RDW_INVALIDATE | RDW_ALLCHILDREN);
			return S_OK;
		},

		Popup: function ()
		{
			return false;
		}
	};
	try {
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\extensioncolor.tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[0]) {
				var a2 = ar[0].toLowerCase().split(/\s*;\s*/);
				for (var i in a2) {
					var s = a2[i].replace(/[\.\*]/, "");
					if (s != "") {
						Addons.ExtensionColor.Color[s] = GetWinColor(ar[1]);
					}
				}
			}
		}
		ado.Close();
	}
	catch (e) {
	}

	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes)
	{
		if (pid && Addons.ExtensionColor.Enabled) {
			var c = Addons.ExtensionColor.Color[fso.GetExtensionName(api.GetDisplayNameOf(pid, SHGDN_FORPARSING)).toLowerCase()];
			if (isFinite(c)) {
				vcd.clrText = c;
				return S_OK;
			}
		}
	});

	if (item) {
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.ExtensionColor.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.ExtensionColor.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.ExtensionColor.nPos, MF_BYPOSITION | MF_STRING | Addons.ExtensionColor.Enabled ? MF_CHECKED : 0, ++nPos, GetText(Addons.ExtensionColor.strName));
				ExtraMenuCommand[nPos] = Addons.ExtensionColor.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.ExtensionColor.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.ExtensionColor.Exec, "Func");
		}
		//Type
		AddTypeEx("Add-ons", "Extension color", Addons.ExtensionColor.Exec);
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="', Addons.ExtensionColor.strName, '" src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px" />';
	}
	else {
		s = Addons.ExtensionColor.strName;
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.ExtensionColor.Exec();" oncontextmenu="Addons.ExtensionColor.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s, '</span>']);
}
else {
	g_nLast = 0;
	document.getElementById("tab4").value = GetText("Color");
	document.getElementById("panel4").innerHTML = '<form name="E" id="data1"></form>';
	AddFilter = function(strPath, strColor)
	{
		s = ['<table style="width: 100%"><tr><td><input type="text" name="p', g_nLast, '" value="', strPath, '" style="width: 100%" onchange="FilterChanged(this)" placeholder="ext" title="Type" /></td>'];
		s.push('<td style="width: 7em"><input type="text" name="c', g_nLast, '" value="', strColor, '"  style="width: 100%" placeholder="Color" title="Color" onchange="FilterChanged()"  /></td>');
		s.push('<td style="width: 1em"><input type="button" name="b', g_nLast, '" value=" " class="color" style="background-color:', strColor, '; width: 100%" onclick="ChooseColor2(this)" title="Color" /></td>');
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
			AddFilter("", "");
		}
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
			var ado = te.CreateObject("Adodb.Stream");
			ado.CharSet = "utf-8";
			ado.Open();
			for (var i = 0; i < g_nLast; i++) {
				var s = document.E.elements['p' + i].value;
				if (s != "") {
					ado.WriteText([s, document.E.elements['c' + i].value].join("\t") + "\r\n");
				}
			}
			ado.SaveToFile(fso.BuildPath(te.Data.DataFolder, "config\\extensioncolor.tsv"), adSaveCreateOverWrite);
			ado.Close();
		}
		catch (e) {
		}
	}

	try {
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\extensioncolor.tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			AddFilter(ar[0], ar[1]);
		}
		ado.Close();
	}
	catch (e) {
	}
	AddFilter("", "");
}
