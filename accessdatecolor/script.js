var Addon_Id = "accessdatecolor";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.AccessDateColor = {
		Color: [],
		nPos: 0,
		strName: "",
		Enabled: true,

		Exec: function ()
		{
			Addons.AccessDateColor.Enabled = !Addons.AccessDateColor.Enabled;
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
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\accessdatecolor.tsv"));
		var tzo = new Date().getTimezoneOffset() * 60000;
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[0]) {
				var s = (ar[0].replace(/([\dx]+)([smhdwy])/ig, function (all, re1, re2)
				{
					return eval(re1.replace(/x/ig, "*")) * smhdw[re2.toLowerCase()] + '+';
				}).replace(/\+$/, "")) - tzo;
				Addons.AccessDateColor.Color.push([s, ar[1] ? GetWinColor(ar[1]) : -1]);
			}
		}
		ado.Close();
	} catch (e) {}

	Addons.AccessDateColor.Color = Addons.AccessDateColor.Color.sort(function (a, b)
	{
		return b[0] - a[0];
	});

	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes)
	{
		if (pid && Addons.AccessDateColor.Enabled) {
			var d = new Date() - pid.ExtendedProperty("Access");
			for (var i = Addons.AccessDateColor.Color.length; i--;) {
				var ar = Addons.AccessDateColor.Color[i];
				if (d < ar[0]) {
					if (ar[1] != -1) {
						vcd.clrText = ar[1];
						return S_OK;
					} else {
						return;
					}
				}
			}
		}
	});

	Addons.AccessDateColor.strName = item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name);
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.AccessDateColor.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.AccessDateColor.nPos, MF_BYPOSITION | MF_STRING | Addons.AccessDateColor.Enabled ? MF_CHECKED : 0, ++nPos, GetText(Addons.AccessDateColor.strName));
			ExtraMenuCommand[nPos] = Addons.AccessDateColor.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.AccessDateColor.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.AccessDateColor.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Access date color", Addons.AccessDateColor.Exec);

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="' + Addons.AccessDateColor.strName + '" src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px" />';
	} else {
		s = Addons.AccessDateColor.strName;
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.AccessDateColor.Exec();" oncontextmenu="Addons.AccessDateColor.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s, '</span>']);
} else {
	hint = "1s 1m 1h 1d 1w 1y";
	importScript("addons\\" + Addon_Id + "\\options.js");
}
