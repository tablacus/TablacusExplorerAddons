const item = GetAddonElement('smallthumbs');

Sync.SmallThumbs = {
	FV: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,
	Filter: item.getAttribute("Filter") || "*",
	Disable: item.getAttribute("Disable") || "-",
	Folder: item.getAttribute("Folder"),

	Clear: function (Ctrl) {
		if (Ctrl.type <= CTRL_SB) {
			delete Sync.SmallThumbs.FV[Ctrl.Id];
		}
	},

	Clear2: function (Ctrl) {
		if (Ctrl.IconSize <= 32) {
			const db = Sync.SmallThumbs.FV[Ctrl.Id];
			if (db) {
				if (db["*"] < Ctrl.IconSize) {
					Sync.SmallThumbs.Clear(Ctrl);
				}
			}
		}
	},

	SetStyle: function () {
		Sync.SmallThumbs.fStyle = LVIS_CUT;
	}
};

AddEvent("HandleIcon", function (Ctrl, pid, iItem) {
	if (Ctrl.IconSize <= 32) {
		let db = Sync.SmallThumbs.FV[Ctrl.Id];
		if (!db) {
			Sync.SmallThumbs.FV[Ctrl.Id] = db = { "*": Ctrl.IconSize };
		}
		const path = pid.Path;
		if (IsFolderEx(pid) ? Sync.SmallThumbs.Folder : api.PathMatchSpec(path, Sync.SmallThumbs.Filter) && !api.PathMatchSpec(path, Sync.SmallThumbs.Disable)) {
			if (db[path]) {
				return /object/i.test(typeof db[path]) ? true : void 0;
			}
			db[path] = 1;
			Threads.GetImage({
				path: pid,
				cx: Ctrl.IconSize * screen.deviceYDPI / 96,
				f: true,
				hList: Ctrl.hwndList,
				iItem: iItem,
				db: db,
				onload: function (o) {
					o.db[o.path.Path] = api.CreateObject("WICBitmap").FromSource(o.out);
					api.PostMessage(o.hList, LVM_REDRAWITEMS, o.iItem, o.iItem);
				}
			});
		}
	}
}, true);

AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd) {
	const hList = Ctrl.hwndList;
	if (hList && Ctrl.IconSize <= 32) {
		const db = Sync.SmallThumbs.FV[Ctrl.Id];
		if (db) {
			let image = db[pid.Path];
			const bThumb = /object/i.test(typeof image);
			if (bThumb || Sync.SmallThumbs.Icon && api.HasThumbnail(pid)) {
				let cl, fStyle, rc = api.Memory("RECT");
				rc.Left = LVIR_ICON;
				api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
				const state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Sync.SmallThumbs.fStyle);
				if (state == LVIS_SELECTED) {
					cl = CLR_DEFAULT;
					fStyle = api.GetFocus() == hList ? ILD_SELECTED : ILD_FOCUS;
				} else {
					cl = CLR_NONE;
					fStyle = (state & LVIS_CUT) || api.GetAttributesOf(pid, SFGAO_HIDDEN) ? ILD_SELECTED : ILD_NORMAL;
				}
				let x = Ctrl.IconSize * screen.deviceYDPI / 96;
				const vm = api.SendMessage(hList, LVM_GETVIEW, 0, 0);
				if (vm == 1) {
					const i = api.SendMessage(hList, LVM_GETCOLUMNWIDTH, 0, 0);
					if (x > i) {
						x = i;
						rc.Right = rc.Left + i;
					}
				} else if (vm == 2) {
					rc.left = rc.right - image.GetWidth();
				}
				if (bThumb) {
					image = GetThumbnail(image, x, true);
					if (image) {
						image.DrawEx(nmcd.hdc, rc.Left + (rc.Right - rc.Left - image.GetWidth()) / 2, rc.Bottom - image.GetHeight(), 0, 0, cl, cl, fStyle);
					}
				}
				if (bThumb) {
					return S_OK;
				}
			}
		}
	}
}, true);

AddEvent("NavigateComplete", Sync.SmallThumbs.Clear);

AddEvent("Command", Sync.SmallThumbs.Clear2);

AddEvent("IconSizeChanged", Sync.SmallThumbs.Clear2);
