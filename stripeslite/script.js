var Addon_Id = "stripeslite";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.StripesLite = {
		Color2: GetWinColor(item.getAttribute("Color2") || "#ececec")
	};

	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes) {
		if (pid && api.SendMessage(Ctrl.hwndList, LVM_GETVIEW, 0, 0) == 1) {
			if (nmcd.dwItemSpec & 1) {
				return;
			}
			vcd.clrTextBk = Addons.StripesLite.Color2;
			if (nmcd.uItemState & CDIS_SELECTED) {
				var rc = api.Memory("RECT");
				api.GetWindowRect(Ctrl.hwndList, rc);
				rc.right -= rc.left;
				rc.left = 0;
				rc.top = nmcd.rc.top;
				rc.bottom = nmcd.rc.bottom;
				api.SetDCBrushColor(nmcd.hdc, Addons.StripesLite.Color2);
				api.FillRect(nmcd.hdc, rc, api.GetStockObject(DC_BRUSH));
			}
		}
	}, true);
} else {
	SetTabContents(0, "", '<input type="text" id="Color2" style="width: 7em" placeholder="#ececec" onchange="ChangeColor1(this)"><input id="Color_Color2" type="button" value=" " class="color" onclick="ChooseColor2(this)">');
}
