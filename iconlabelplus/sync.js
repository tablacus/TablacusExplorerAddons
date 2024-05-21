const Addon_Id = "iconlabelplus";

Sync.IconLabelPlus = {
	ReplaceColumns: function (FV, pid, s) {
		const hList = FV.hwndList;
		if (hList && !api.SendMessage(hList, LVM_GETVIEW, 0, 0)) {
			const hdc = api.GetDC(hList);
			const hOld = api.SelectObject(hdc, CreateFont(DefaultFont));
			const rc = api.Memory("RECT");
			rc.Left = LVIR_LABEL;
			api.SendMessage(hList, LVM_GETITEMRECT, 0, rc);
			const w = rc.Right - rc.Left - 4;
			let h = 0;
			rc.Left = 0;
			rc.Top = 0;
			for (let i = 1; i < s.length; ++i) {
				api.DrawText(hdc, s.slice(0, i), -1, rc, DT_NOPREFIX | DT_WORDBREAK | DT_CALCRECT);
				if (rc.Right >= w) {
					api.SelectObject(hdc, hOld);
					api.ReleaseDC(hList, hdc);
					return s.slice(0, i - 1) + "\r" + s.slice(i - 1);
				}
				if (h) {
					if (h < rc.Bottom) {
						break;
					}
				} else {
					h = rc.Bottom;
				}
			}
			api.SelectObject(hdc, hOld);
			api.ReleaseDC(hList, hdc);
		}
	},

	Init: function (FV) {
		ColumnsReplace(FV, "Name", HDF_LEFT, Sync.IconLabelPlus.ReplaceColumns);
	}
};

AddEvent("Load", function () {
	AddEvent("ViewCreated", Sync.IconLabelPlus.Init);
	const cFV = te.Ctrls(CTRL_FV);
	for (let i in cFV) {
		Sync.IconLabelPlus.Init(cFV[i]);
	}
});

