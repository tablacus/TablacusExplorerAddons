var Addon_Id = "stripeslite";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.StripesLite = {
		Color2: GetWinColor(item.getAttribute("Color2") || "#ececec")
	};

	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes)
	{
		if (Ctrl.Type <= CTRL_EB && pid) {
			if (nmcd.dwItemSpec & 1) {
				return;
			}
			vcd.clrTextBk = Addons.StripesLite.Color2;
		}
	}, true);
} else {
	SetTabContents(0, "Color", '<input type="text" id="Color2" style="width: 7em" onchange="ChangeColor1(this)" /><input id="Color_Color2" type="button" value=" " class="color" onclick="ChooseColor2(this)" />');
}
