var Addon_Id = "createdatecolor";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.CreateDateColor = {
		Color: [],
		nPos: 0,
		strName: "",
		Enabled: true,

		Exec: function ()
		{
			Addons.CreateDateColor.Enabled = !Addons.CreateDateColor.Enabled;
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
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\createdatecolor.tsv"));
		var tzo = new Date().getTimezoneOffset() * 60000;
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[0]) {
				var s = (ar[0].replace(/([\dx]+)([smhdwy])/ig, function (all, re1, re2)
				{
					return eval(re1.replace(/x/ig, "*")) * smhdw[re2.toLowerCase()] + '+';
				}).replace(/\+$/, "")) - tzo;
				Addons.CreateDateColor.Color.push([s, ar[1] ? GetWinColor(ar[1]) : -1]);
			}
		}
		ado.Close();
	} catch (e) {}

	Addons.CreateDateColor.Color = Addons.CreateDateColor.Color.sort(function (a, b)
	{
		return b[0] - a[0];
	});

	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes)
	{
		if (pid && Addons.CreateDateColor.Enabled) {
			var d = new Date() - pid.ExtendedProperty("Create");
			for (var i = Addons.CreateDateColor.Color.length; i--;) {
				var ar = Addons.CreateDateColor.Color[i];
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

	Addons.CreateDateColor.strName = item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name);
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.CreateDateColor.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.CreateDateColor.nPos, MF_BYPOSITION | MF_STRING | Addons.CreateDateColor.Enabled ? MF_CHECKED : 0, ++nPos, GetText(Addons.CreateDateColor.strName));
			ExtraMenuCommand[nPos] = Addons.CreateDateColor.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.CreateDateColor.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.CreateDateColor.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Create date color", Addons.CreateDateColor.Exec);

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="' + Addons.CreateDateColor.strName + '" src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px" />';
	} else {
		s = Addons.CreateDateColor.strName;
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.CreateDateColor.Exec();" oncontextmenu="Addons.CreateDateColor.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s, '</span>']);
} else {
	hint = "1s 1m 1h 1d 1w 1y";
	importScript("addons\\" + Addon_Id + "\\options.js");
}
