const Addon_Id = "overlaylabel";
let item = GetAddonElement(Addon_Id);

Sync.OverlayLabel = {
	Color: GetWinColor(item.getAttribute("Color")),
	IsBGColor: item.getAttribute("Color") != "",
	BGColor: GetBGRA(GetWinColor(item.getAttribute("BGColor")), (item.getAttribute("BGAlpha") & 0xff) || 128),
	No: []
};
for (let i = 5; i--;) {
	Sync.OverlayLabel.No[i] = item.getAttribute("No_" + i);
}
Sync.OverlayLabel.sBGColor =

delete item;

AddEvent("Load", function () {
	if (Sync.Label) {
		AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd) {
			const hList = Ctrl.hwndList;
			if (hList && pid) {
				const ViewMode = api.SendMessage(hList, LVM_GETVIEW, 0, 0);
				if (!Sync.OverlayLabel.No[ViewMode]) {
					const label = Sync.Label.DB.Get(api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
					if (label) {
						const rc = api.Memory("RECT");
						rc.left = ViewMode ? LVIR_LABEL : LVIR_ICON;
						api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
						const cl = api.SetTextColor(nmcd.hdc, Sync.OverlayLabel.Color);
						if (Sync.OverlayLabel.IsBGColor) {
							const r = rc.right - 1;
							const b = rc.bottom - 1;
							api.DrawText(nmcd.hdc, label, -1, rc, DT_SINGLELINE | DT_NOPREFIX | DT_CALCRECT);
							const w = rc.right - rc.left;
							const h = rc.bottom - rc.top;
							rc.left = r - w;
							rc.right = r;
							rc.top = b - h;
							rc.bottom = b;
							api.FillRect(nmcd.hdc, rc, null, Sync.OverlayLabel.BGColor);
						}
						api.DrawText(nmcd.hdc, label, -1, rc, DT_RIGHT | DT_BOTTOM | DT_SINGLELINE | DT_NOPREFIX);
						api.SetTextColor(nmcd.hdc, cl);
					}
				}
			}
		});
	}
});
