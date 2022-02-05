const Addon_Id = "stripeslite";
const item = GetAddonElement(Addon_Id);

Sync.StripesLite = {
	Color: GetBGRA(GetWinColor(item.getAttribute("Color2") || "#7f7f7f"), (item.getAttribute("Alpha") & 0xff) || 64),
};

AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes) {
	if (pid && api.SendMessage(Ctrl.hwndList, LVM_GETVIEW, 0, 0) == 1) {
		if (nmcd.dwItemSpec & 1) {
			return;
		}
		vcd.clrTextBk = CLR_NONE;
		api.FillRect(nmcd.hdc, nmcd.rc, null, Sync.StripesLite.Color);
	}
}, true);
