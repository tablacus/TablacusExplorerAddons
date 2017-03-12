var Addon_Id = "stripeslite";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.StripesLite = {
		Color: [],
		nPos: 0,
		strName: "",
		Enabled: true,
		Color2: GetWinColor(item.getAttribute("Color2") || "#ececec"),

		Exec: function ()
		{
			Addons.StripesLite.Enabled = !Addons.StripesLite.Enabled;
			api.RedrawWindow(te.hwnd, null, 0, RDW_NOERASE | RDW_INVALIDATE | RDW_ALLCHILDREN);
			return S_OK;
		},

		Popup: function ()
		{
			return false;
		}
	};

	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes)
	{
		if (Ctrl.Type <= CTRL_EB && pid && Addons.StripesLite.Enabled) {
			if (nmcd.dwItemSpec & 1) {
				vcd.clrTextBk = Addons.StripesLite.Color2;
			}
		}
	}, true);

	Addons.StripesLite.strName = item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name);
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.StripesLite.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.StripesLite.nPos, MF_BYPOSITION | MF_STRING | Addons.StripesLite.Enabled ? MF_CHECKED : 0, ++nPos, GetText(Addons.StripesLite.strName));
			ExtraMenuCommand[nPos] = Addons.StripesLite.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.StripesLite.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.StripesLite.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Stripes lite", Addons.StripesLite.Exec);

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="' + Addons.StripesLite.strName + '" src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px" />';
	} else {
		s = Addons.StripesLite.strName;
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.StripesLite.Exec();" oncontextmenu="Addons.StripesLite.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s, '</span>']);
} else {
	SetTabContents(0, "Color", '<input type="text" id="Color2" style="width: 7em" onchange="ChangeColor1(this)" /><input id="Color_Color2" type="button" value=" " class="color" onclick="ChooseColor2(this)" />');
}
