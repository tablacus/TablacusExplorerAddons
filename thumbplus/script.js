var item = GetAddonElement('thumbplus');

Addons.ThumbPlus = {
	FV: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,
	Filter: item.getAttribute("Filter") || "*",
	Disable: item.getAttribute("Disable") || "-",
	Priority: item.getAttribute("Priority") || "-",
	Folder: api.LowPart(item.getAttribute("Folder")),
	Icon: api.LowPart(item.getAttribute("ShowIcon")),

	Clear: function (Ctrl) {
		if (Ctrl.type <= CTRL_SB) {
			delete Addons.ThumbPlus.FV[Ctrl.Id];
		}
	},

	Clear2: function (Ctrl) {
		var db = Addons.ThumbPlus.FV[Ctrl.Id];
		if (db) {
			if (db["*"] < Ctrl.IconSize) {
				Addons.ThumbPlus.Clear(Ctrl);
			}
		}
	}
};

if (window.Addon == 1) {
	AddEvent("HandleIcon", function (Ctrl, pid, iItem) {
		if (Ctrl.IconSize > 32) {
			var db = Addons.ThumbPlus.FV[Ctrl.Id];
			if (!db) {
				Addons.ThumbPlus.FV[Ctrl.Id] = db = { "*": Ctrl.IconSize };
			}
			var path = pid.Path;
			if (api.PathMatchSpec(path, Addons.ThumbPlus.Priority) || (Addons.ThumbPlus.Folder && IsFolderEx(pid)) || (api.PathMatchSpec(path, Addons.ThumbPlus.Filter) && !api.PathMatchSpec(path, Addons.ThumbPlus.Disable) && !api.HasThumbnail(pid))) {
				if (db[path]) {
					return /object/i.test(typeof db[path]) ? true : undefined;
				}
				db[path] = 1;
				Threads.GetImage({
					path: pid,
					cx: Ctrl.IconSize * screen.logicalYDPI / 96,
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
		var hList = Ctrl.hwndList;
		if (hList && Ctrl.IconSize > 32) {
			var db = Addons.ThumbPlus.FV[Ctrl.Id];
			if (db) {
				var image = db[pid.Path];
				var bThumb = /object/i.test(typeof image);
				if (bThumb || Addons.ThumbPlus.Icon && api.HasThumbnail(pid)) {
					var cl, fStyle, rc = api.Memory("RECT");
					rc.Left = LVIR_ICON;
					api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
					var state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Addons.ThumbPlus.fStyle);
					if (state == LVIS_SELECTED) {
						cl = CLR_DEFAULT;
						fStyle = api.GetFocus() == hList ? ILD_SELECTED : ILD_FOCUS;
					} else {
						cl = CLR_NONE;
						fStyle = (state & LVIS_CUT) || api.GetAttributesOf(pid, SFGAO_HIDDEN) ? ILD_SELECTED : ILD_NORMAL;
					}
					var x = Ctrl.IconSize * screen.logicalYDPI / 96;
					if (Ctrl.CurrentViewMode == FVM_DETAILS) {
						var i = api.SendMessage(hList, LVM_GETCOLUMNWIDTH, 0, 0);
						if (x > i) {
							x = i;
							rc.Right = rc.Left + i;
						}
					}
					if (bThumb) {
						image = GetThumbnail(image, x, true);
						if (image) {
							image.DrawEx(nmcd.hdc, rc.Left + (rc.Right - rc.Left - image.GetWidth()) / 2, rc.Bottom - image.GetHeight(), 0, 0, cl, cl, fStyle);
						}
					}
					if (Addons.ThumbPlus.Icon) {
						var sfi = api.Memory("SHFILEINFO");
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

	AddEvent("NavigateComplete", Addons.ThumbPlus.Clear);

	AddEvent("Command", Addons.ThumbPlus.Clear2);

	AddEvent("IconSizeChanged", Addons.ThumbPlus.Clear2);

	if (api.IsAppThemed() && WINVER >= 0x600) {
		AddEvent("Load", function () {
			if (!Addons.ClassicStyle) {
				Addons.ThumbPlus.fStyle = LVIS_CUT;
			}
		});
	}
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}
