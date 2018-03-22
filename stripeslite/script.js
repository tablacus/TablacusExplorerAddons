var Addon_Id = "stripeslite";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.StripesLite = {
		Color2: GetWinColor(item.getAttribute("Color2") || "#ececec")
	};
	Addons.StripesLite.Brush = api.CreateSolidBrush(Addons.StripesLite.Color2);

	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes)
	{
		if (pid && api.SendMessage(Ctrl.hwndList, LVM_GETVIEW, 0, 0) == 1) {
			if (nmcd.dwItemSpec & 1) {
				return;
			}
			vcd.clrTextBk = Addons.StripesLite.Color2;
			if (nmcd.uItemState & CDIS_SELECTED) {
				api.FillRect(nmcd.hdc, nmcd.rc, Addons.StripesLite.Brush);
			}
		}
	}, true);

	AddEvent("Finalize", function ()
	{
		api.DeleteObject(Addons.StripesLite.Brush);
	});

} else {
	SetTabContents(0, "Color", '<input type="text" id="Color2" style="width: 7em" onchange="ChangeColor1(this)" /><input id="Color_Color2" type="button" value=" " class="color" onclick="ChooseColor2(this)" />');
}
