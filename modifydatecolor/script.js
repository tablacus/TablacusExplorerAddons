var Addon_Id = "modifydatecolor";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.ModofyDateColor = {
		Color: [],
		nPos: 0,
		strName: "",
		Enabled: true,

		Exec: function ()
		{
			Addons.ModofyDateColor.Enabled = !Addons.ModofyDateColor.Enabled;
			api.RedrawWindow(te.hwnd, null, 0, RDW_NOERASE | RDW_INVALIDATE | RDW_ALLCHILDREN);
			return S_OK;
		},

		Popup: function ()
		{
			return false;
		}
	};
	try {
		var smhdw = {s: 1000, m: 60000,  h:3600000, d: 86400000, w: 604800000, y: 31536000000 };
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\modifydatecolor.tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[1] && ar[1]) {
				s = (ar[0].replace(/([\dx]+)([smhdw])/ig, function (all, re1, re2)
				{
					return eval(re1.replace(/x/ig, "*")) * smhdw[re2.toLowerCase()] + '+';
				}).replace(/\+$/, ""));
				Addons.ModofyDateColor.Color.push(s + "," + GetWinColor(ar[1]));
			}
		}
		ado.Close();
	} catch (e) {}
	Addons.ModofyDateColor.Color = Addons.ModofyDateColor.Color.sort(function (a, b)
	{
		return b.replace(/,.*$/, "") - a.replace(/,.*$/, "");
	});
	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes)
	{
		if (pid && Addons.ModofyDateColor.Enabled) {
			var d = new Date() - pid.ModifyDate;
			for (var i = Addons.ModofyDateColor.Color.length; i--;) {
				var ar = Addons.ModofyDateColor.Color[i].split(/,/);
				if (d < ar[0]) {
					vcd.clrText = ar[1];
					return S_OK;
				}
			}
		}
	});

	Addons.ModofyDateColor.strName = item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name);
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.ModofyDateColor.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.ModofyDateColor.nPos, MF_BYPOSITION | MF_STRING | Addons.ModofyDateColor.Enabled ? MF_CHECKED : 0, ++nPos, GetText(Addons.ModofyDateColor.strName));
			ExtraMenuCommand[nPos] = Addons.ModofyDateColor.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.ModofyDateColor.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.ModofyDateColor.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Modofy date color", Addons.ModofyDateColor.Exec);

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="' + Addons.ModofyDateColor.strName + '" src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px" />';
	} else {
		s = Addons.ModofyDateColor.strName;
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.ModofyDateColor.Exec();" oncontextmenu="Addons.ModofyDateColor.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s, '</span>']);
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
