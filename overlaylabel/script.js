var Addon_Id = "overlaylabel";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Color", "#ff0000");
}

if (window.Addon == 1) {
	Addons.OverlayLabel = {
		Color: GetWinColor(item.getAttribute("Color")),
		No: []
	};
	for (var i = 5; i--;) {
		Addons.OverlayLabel.No[i] = item.getAttribute("No_" + i);
	}
	
	AddEvent("Load", function ()
	{
		if (Addons.Label) {
			AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd)
			{
				var hList = Ctrl.hwndList;
				if (hList && pid) {
					var ViewMode = api.SendMessage(hList, LVM_GETVIEW, 0, 0);
					if (!Addons.OverlayLabel.No[ViewMode]) {
						var label = Addons.Label.Get(api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
						if (label) {
							var rc = api.Memory("RECT");
							rc.Left = ViewMode ? LVIR_LABEL : LVIR_ICON;
							api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
							var cl = api.SetTextColor(nmcd.hdc, Addons.OverlayLabel.Color);
							api.DrawText(nmcd.hdc, label, -1, rc, DT_RIGHT | DT_BOTTOM | DT_SINGLELINE | DT_NOPREFIX);
							api.SetTextColor(nmcd.hdc, cl);
						}
					}
				}
			});
		}
	});
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
