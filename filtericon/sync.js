Sync.FilterIcon = {
	FV: {},
	List: [['', 0, 0]],
	fStyle: LVIS_CUT | LVIS_SELECTED,

	GetIconImage: function (fn, Large) {
		fn = ExtractPath(te, fn);
		return api.CreateObject("WICBitmap").FromFile(fn) || MakeImgData(fn, 0, Large ? 48 : 16);
	},

	SetStyle: function () {
		Sync.FilterIcon.fStyle = LVIS_CUT;
	}
};

AddEvent("HandleIcon", function (Ctrl, pid) {
	if (Ctrl.hwndList) {
		let db = Sync.FilterIcon.FV[Ctrl.Id];
		if (!db) {
			db = Sync.FilterIcon.FV[Ctrl.Id] = {};
		}
		const i = Ctrl.IconSize < 32 ? 1 : 2, list = Sync.FilterIcon.List;
		const path = api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		let j = db[path];
		if (isFinite(j)) {
			if (/object/i.test(typeof list[j][i])) {
				return true;
			}
			if (!/string/i.test(typeof list[j][i])) {
				return false;
			}
		}
		for (let j = 1; j < list.length; j++) {
			if (PathMatchEx(path, list[j][0])) {
				let image = list[j][i];
				if (image) {
					db[path] = j;
					if (/string/i.test(typeof image)) {
						image = Sync.FilterIcon.GetIconImage(image, i);
						if (image) {
							list[j][i] = GetThumbnail(image, [0, 32, 256][i] * screen.deviceYDPI / 96, true);
							return true;
						} else {
							list[j][i] = 0;
						}
					}
				}
				return;
			}
		}
		db[path] = 0;
	}
});

AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd) {
	const hList = Ctrl.hwndList;
	if (hList) {
		const i = Ctrl.IconSize < 32 ? 1 : 2, list = Sync.FilterIcon.List;
		const path = api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		const db = Sync.FilterIcon.FV[Ctrl.Id];
		const j = db && db[path];
		if (isFinite(j)) {
			let image = list[j][i];
			if (/object/i.test(typeof image)) {
				let cl, fStyle, rc = api.Memory("RECT");
				rc.Left = LVIR_ICON;
				api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
				const state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Sync.FilterIcon.fStyle);
				if (state == LVIS_SELECTED) {
					cl = CLR_DEFAULT;
					fStyle = api.GetFocus() == hList ? ILD_SELECTED : ILD_FOCUS;
				} else {
					cl = CLR_NONE;
					fStyle = (state & LVIS_CUT) || api.GetAttributesOf(pid, SFGAO_HIDDEN) ? ILD_SELECTED : ILD_NORMAL;
				}
				image = GetThumbnail(image, Ctrl.IconSize * screen.deviceYDPI / 96, Ctrl.IconSize >= 32);
				image.DrawEx(nmcd.hdc, rc.Left + (rc.Right - rc.Left - image.GetWidth()) / 2, rc.Top + (rc.Bottom - rc.Top - image.GetHeight()) / 2, 0, 0, cl, cl, fStyle);
				return S_OK;
			}
		}
	}
});

AddEvent("NavigateComplete", function (Ctrl) {
	Sync.FilterIcon.FV[Ctrl.Id] = {};
});

try {
	const ado = OpenAdodbFromTextFile(BuildPath(te.Data.DataFolder, "config\\filtericon.tsv"));
	while (!ado.EOS) {
		const ar = ExtractMacro(te, ado.ReadText(adReadLine)).split("\t");
		if (ar[0]) {
			Sync.FilterIcon.List.push(ar);
		}
	}
	ado.Close();
} catch (e) { }
