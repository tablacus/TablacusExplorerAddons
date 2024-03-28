const Addon_Id = "iconlabelplus";

Sync.IconLabelPlus = {
	FV: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,

	SetStyle: function () {
		Sync.IconLabelPlus.fStyle = LVIS_CUT;
	}
};

AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd) {
	const hList = Ctrl.hwndList;
	if (hList && !(nmcd.uItemState & CDIS_FOCUS) && !api.SendMessage(hList, LVM_GETVIEW, 0, 0)) {
		const rc = api.Memory("RECT");
		api.DrawText(nmcd.hdc, "a\na", -1, rc, DT_CALCRECT);
		const h = rc.Bottom;
		rc.Left = LVIR_LABEL;
		api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
		if (rc.Bottom - rc.Top < h) {
			const item = api.Memory("LVITEM");
			item.mask = LVIF_TEXT;
			item.pszText = api.Memory("WCHAR", 260);
			item.cchTextMax = 260;
			item.iItem = nmcd.dwItemSpec;
			api.SendMessage(hList, LVM_GETITEM, 0, item);
			const label = api.SysAllocString(item.pszText);

			let w = rc.Right - rc.Left;
			const rc2 = api.Memory("RECT");
			for (let i = 1; i < label.length; ++i) {
				rc2.Right = rc.Right;
				rc2.Bottom = h;
				api.DrawText(nmcd.hdc, label.slice(0, i), -1, rc2, DT_NOPREFIX | DT_WORDBREAK | DT_CALCRECT);
				if (h <= rc2.Bottom) {
					break;
				}
				if (w < rc2.Right) {
					const clBk = api.GetPixel(nmcd.hdc, rc.Left, rc.Top);
					const brush = api.CreateSolidBrush(clBk >= 0 ? clBk : vcd.clrTextBk);
					api.FillRect(nmcd.hdc, rc, brush);
					api.DeleteObject(brush);
					api.SetTextColor(nmcd.hdc, vcd.clrText);
					rc.Bottom = rc.Top + h * 2 * 2;
					api.DrawText(nmcd.hdc, label.slice(0, i - 1) + "\n" + label.slice(i - 1), -1, rc, DT_CENTER | DT_NOPREFIX | DT_WORDBREAK | DT_WORD_ELLIPSIS | DT_INTERNAL);
					break;
				}
			}
		}
	}
}, true);
