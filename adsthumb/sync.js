Sync.ADSThumb = {
	FV: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,

	Clear: function (Ctrl) {
		if (Ctrl.type <= CTRL_SB) {
			delete Sync.ADSThumb.FV[Ctrl.Id];
		}
	},

	Clear2: function (Ctrl) {
		const db = Sync.ADSThumb.FV[Ctrl.Id];
		if (db) {
			if (db["*"] < Ctrl.IconSize) {
				Sync.ADSThumb.Clear(Ctrl);
			}
		}
	},

	SetStyle: function () {
		Sync.ADSThumb.fStyle = LVIS_CUT;
	}
};

AddEvent("HandleIcon", function (Ctrl, pid, iItem) {
	if (Ctrl.IconSize > 32) {
		let db = Sync.ADSThumb.FV[Ctrl.Id];
		if (!db) {
			Sync.ADSThumb.FV[Ctrl.Id] = db = { "*": Ctrl.IconSize };
		}
		const path = pid.Path;
		if (db[path]) {
			return /object|function/i.test(typeof db[path]) ? true : void 0;
		}
		db[path] = 1;
		Threads.GetImage({
			org: path,
			path: path + ":thumbnail.jpg",
			f: true,
			hList: Ctrl.hwndList,
			iItem: iItem,
			db: db,
			callback: function (o) {
				o.db[o.org] = o.out;
				api.PostMessage(o.hList, LVM_REDRAWITEMS, o.iItem, o.iItem);
			}
		});
	}
}, true);

AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd) {
	const hList = Ctrl.hwndList;
	if (hList && Ctrl.IconSize > 32) {
		const db = Sync.ADSThumb.FV[Ctrl.Id];
		if (db) {
			let image = db[pid.Path];
			if (/object/i.test(typeof image)) {
				let cl, fStyle, rc = api.Memory("RECT");
				rc.left = LVIR_ICON;
				api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
				const state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Sync.ADSThumb.fStyle);
				if (state == LVIS_SELECTED) {
					cl = CLR_DEFAULT;
					fStyle = api.GetFocus() == hList ? ILD_SELECTED : ILD_FOCUS;
				} else {
					cl = CLR_NONE;
					fStyle = (state & LVIS_CUT) || api.GetAttributesOf(pid, SFGAO_HIDDEN) ? ILD_SELECTED : ILD_NORMAL;
				}
				let x = Ctrl.IconSize * screen.deviceYDPI / 96;
				if (Ctrl.CurrentViewMode == FVM_DETAILS) {
					const i = api.SendMessage(hList, LVM_GETCOLUMNWIDTH, 0, 0);
					if (x > i) {
						x = i;
						rc.right = rc.left + i;
					}
				}
				image = GetThumbnail(image, x, true);
				if (image) {
					image.DrawEx(nmcd.hdc, rc.left + (rc.right - rc.left - image.GetWidth()) / 2, rc.bottom - image.GetHeight(), 0, 0, cl, cl, fStyle);
					return S_OK;
				}
			}
		}
	}
}, true);

AddEvent("NavigateComplete", Sync.ADSThumb.Clear);

AddEvent("Command", Sync.ADSThumb.Clear2);

AddEvent("IconSizeChanged", Sync.ADSThumb.Clear2);
