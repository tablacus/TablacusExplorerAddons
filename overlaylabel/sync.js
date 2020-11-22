var Addon_Id = "overlaylabel";
var item = GetAddonElement(Addon_Id);

Sync.OverlayLabel = {
	Color: GetWinColor(item.getAttribute("Color")),
	No: []
};
for (var i = 5; i--;) {
	Sync.OverlayLabel.No[i] = item.getAttribute("No_" + i);
}

AddEvent("Load", function () {
	if (Sync.Label) {
		AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd) {
			var hList = Ctrl.hwndList;
			if (hList && pid) {
				var ViewMode = api.SendMessage(hList, LVM_GETVIEW, 0, 0);
				if (!Sync.OverlayLabel.No[ViewMode]) {
					var label = Sync.Label.DB.Get(api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
					if (label) {
						var rc = api.Memory("RECT");
						rc.Left = ViewMode ? LVIR_LABEL : LVIR_ICON;
						api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
						var cl = api.SetTextColor(nmcd.hdc, Sync.OverlayLabel.Color);
						api.DrawText(nmcd.hdc, label, -1, rc, DT_RIGHT | DT_BOTTOM | DT_SINGLELINE | DT_NOPREFIX);
						api.SetTextColor(nmcd.hdc, cl);
					}
				}
			}
		});
	}
});
