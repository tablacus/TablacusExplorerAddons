var Addon_Id = "stripeslite";
var item = GetAddonElement(Addon_Id);

Sync.StripesLite = {
	Color2: GetWinColor(item.getAttribute("Color2") || "#ececec")
};

AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes) {
	if (pid && api.SendMessage(Ctrl.hwndList, LVM_GETVIEW, 0, 0) == 1) {
		if (nmcd.dwItemSpec & 1) {
			return;
		}
		vcd.clrTextBk = Sync.StripesLite.Color2;
		if (nmcd.uItemState & CDIS_SELECTED) {
			api.SetDCBrushColor(nmcd.hdc, Sync.StripesLite.Color2);
			api.FillRect(nmcd.hdc, nmcd.rc, api.GetStockObject(DC_BRUSH));
		}
	}
}, true);
