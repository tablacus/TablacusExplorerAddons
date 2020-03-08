var Addon_Id = "sizebarchart";

var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.SizeBarChart =
	{
		Color: GetBGRA(GetWinColor(item.getAttribute("Color") || "#008080"), (item.getAttribute("Alpha") & 0xff) || 128),
		Height: Math.max(api.LowPart(item.getAttribute("Height")) || 3, 1),
	}

	AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd)
	{
		var hList = Ctrl.hwndList;
		if (hList && pid) {
			var s = Ctrl.TotalFileSize[api.GetDisplayNameOf(pid, SHGDN_FORPARSING | SHGDN_ORIGINAL)] || pid.ExtendedProperty("size");
			if (s) {
				var w = Math.min(Math.pow(s, .25) / 270, 1) * (nmcd.rc.right - nmcd.rc.left - 2) + 1;
				var h = Math.min(Addons.SizeBarChart.Height, nmcd.rc.bottom - nmcd.rc.top);
				var image = api.CreateObject("WICBitmap").Create(w, h);
				if (image) {
					image.FillRect(0, 0, w, h, Addons.SizeBarChart.Color);
					image.DrawEx(nmcd.hdc, nmcd.rc.left + 1, nmcd.rc.bottom - h, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
				} else {
					Addons.Debug.alert(w);
				}
			}
		}
	}, true);

} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html", "utf-8");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}
