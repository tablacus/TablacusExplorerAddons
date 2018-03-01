var Addon_Id = "underline";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Underline = {
		Color: GetWinColor(item.getAttribute("Color") || "#ececec")
	};

	AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd)
	{
		if (Ctrl.Type <= CTRL_EB && pid) {
			var pen1 = api.CreatePen(PS_SOLID, 1, Addons.Underline.Color);
			var hOld = api.SelectObject(nmcd.hdc, pen1);
			api.MoveToEx(nmcd.hdc, nmcd.rc.Right, nmcd.rc.Bottom - 1, null);
			api.LineTo(nmcd.hdc, nmcd.rc.Left, nmcd.rc.Bottom - 1);
			api.SelectObject(nmcd.hdc, hOld);
			api.DeleteObject(pen1);
		}
	});
} else {
	SetTabContents(0, "Color", '<input type="text" id="Color" style="width: 7em" onchange="ChangeColor1(this)" /><input id="Color_Color" type="button" value=" " class="color" onclick="ChooseColor2(this)" />');
}
