var Addon_Id = "extensioncolor";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.ExtensionColor = {
		Color: {},
		nPos: 0,
		strName: "",
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
		var ado = api.CreateObject("ads");
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
	} catch (e) {}

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

	Addons.ExtensionColor.strName = item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name);
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.ExtensionColor.nPos = api.LowPart(item.getAttribute("MenuPos"));
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

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="' + Addons.ExtensionColor.strName + '" src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px" />';
	} else {
		s = Addons.ExtensionColor.strName;
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.ExtensionColor.Exec();" oncontextmenu="Addons.ExtensionColor.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s, '</span>']);
} else {
	hint = "ext";
	importScript("addons\\" + Addon_Id + "\\options.js");
}
