const Addon_Id = "thumbplus";
const item = GetAddonElement(Addon_Id);

Sync.ThumbPlus = {
	FV: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,
	Filter: item.getAttribute("Filter") || "*",
	Disable: item.getAttribute("Disable") || "-",
	Priority: item.getAttribute("Priority") || "-",
	Folder: GetNum(item.getAttribute("Folder")),
	Icon: GetNum(item.getAttribute("ShowIcon")),

	Clear: function (Ctrl) {
		if (Ctrl.type <= CTRL_SB) {
			delete Sync.ThumbPlus.FV[Ctrl.Id];
		}
	},

	Clear2: function (Ctrl) {
		const db = Sync.ThumbPlus.FV[Ctrl.Id];
		if (db) {
			if (db["*"] < Ctrl.IconSize) {
				Sync.ThumbPlus.Clear(Ctrl);
			}
		}
	},

	SetStyle: function () {
		Sync.ThumbPlus.fStyle = LVIS_CUT;
	}
};

AddEvent("HandleIcon", function (Ctrl, pid, iItem) {
	if (Ctrl.IconSize > 32) {
		let db = Sync.ThumbPlus.FV[Ctrl.Id];
		if (!db) {
			Sync.ThumbPlus.FV[Ctrl.Id] = db = { "*": Ctrl.IconSize };
		}
		const path = pid.Path;
		if (IsFolderEx(pid) ? Sync.ThumbPlus.Folder : (api.PathMatchSpec(path, Sync.ThumbPlus.Priority) || (!api.HasThumbnail(pid) && api.PathMatchSpec(path, Sync.ThumbPlus.Filter) && !api.PathMatchSpec(path, Sync.ThumbPlus.Disable)))) {
			if (!IsCloud(pid)) {
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
						o.db[o.path.Path] = o.out;
						api.PostMessage(o.hList, LVM_REDRAWITEMS, o.iItem, o.iItem);
					}
				});
			}
		}
	}
}, true);

AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd) {
	const hList = Ctrl.hwndList;
	if (hList && Ctrl.IconSize > 32) {
		const db = Sync.ThumbPlus.FV[Ctrl.Id];
		if (db) {
			let image = db[pid.Path];
			const bThumb = /object/i.test(typeof image);
			if (bThumb || Sync.ThumbPlus.Icon && api.HasThumbnail(pid)) {
				let cl, fStyle, rc = api.Memory("RECT");
				rc.Left = LVIR_ICON;
				api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
				const state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Sync.ThumbPlus.fStyle);
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
						rc.Right = rc.Left + i;
					}
				}
				api.OutputDebugString([pid.Path, x].join(",") + "\n");
				if (bThumb) {
					image = GetThumbnail(image, x, true);
					if (image) {
						image.DrawEx(nmcd.hdc, rc.Left + (rc.Right - rc.Left - image.GetWidth()) / 2, rc.Bottom - image.GetHeight(), 0, 0, cl, cl, fStyle);
					}
				}
				if (Sync.ThumbPlus.Icon) {
					const sfi = api.Memory("SHFILEINFO");
					api.SHGetFileInfo(pid, 0, sfi, sfi.Size, SHGFI_SYSICONINDEX | SHGFI_PIDL);
					api.ImageList_Draw(te.Data.SHIL[SHIL_SMALL], sfi.iIcon, nmcd.hdc, rc.Right - te.Data.SHILS[SHIL_SMALL].cx, rc.bottom - te.Data.SHILS[SHIL_SMALL].cy, fStyle | ILD_TRANSPARENT);
				}
				if (bThumb) {
					return S_OK;
				}
			}
		}
	}
}, true);

AddEvent("NavigateComplete", Sync.ThumbPlus.Clear);

AddEvent("Command", Sync.ThumbPlus.Clear2);

AddEvent("IconSizeChanged", Sync.ThumbPlus.Clear2);

AddEvent("ChangeNotify", function (Ctrl, pidls, wParam, lParam) {
	if (pidls.lEvent & (SHCNE_UPDATEITEM | SHCNE_RENAMEITEM | SHCNE_DELETE)) {
		const path1 = pidls[0].Path;
		for (let Id in Sync.ThumbPlus.FV) {
			const db = Sync.ThumbPlus.FV[Id];
			if (db) {
				delete db[path1];
			}
		}
	}
});
