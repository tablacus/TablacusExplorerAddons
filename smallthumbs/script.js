var item = GetAddonElement('smallthumbs');

Addons.SmallThumbs = {
	FV: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,
	Filter: item.getAttribute("Filter") || "*",
	Disable: item.getAttribute("Disable") || "-",
	Folder: item.getAttribute("Folder"),

	Clear: function (Ctrl) {
		if (Ctrl.type <= CTRL_SB) {
			delete Addons.SmallThumbs.FV[Ctrl.Id];
		}
	},

	Clear2: function (Ctrl) {
		if (Ctrl.IconSize <= 32) {
			var db = Addons.SmallThumbs.FV[Ctrl.Id];
			if (db) {
				if (db["*"] < Ctrl.IconSize) {
					Addons.SmallThumbs.Clear(Ctrl);
				}
			}
		}
	}
};

if (window.Addon == 1) {
	AddEvent("HandleIcon", function (Ctrl, pid, iItem) {
		if (Ctrl.IconSize <= 32) {
			var db = Addons.SmallThumbs.FV[Ctrl.Id];
			if (!db) {
				Addons.SmallThumbs.FV[Ctrl.Id] = db = { "*": Ctrl.IconSize };
			}
			var path = pid.Path;
			if (IsFolderEx(pid) ? Addons.SmallThumbs.Folder : api.PathMatchSpec(path, Addons.SmallThumbs.Filter) && !api.PathMatchSpec(path, Addons.SmallThumbs.Disable)) {
				if (db[path]) {
					return /object/i.test(typeof db[path]) ? true : void 0;
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
		if (hList && Ctrl.IconSize <= 32) {
			var db = Addons.SmallThumbs.FV[Ctrl.Id];
			if (db) {
				var image = db[pid.Path];
				var bThumb = /object/i.test(typeof image);
				if (bThumb || Addons.SmallThumbs.Icon && api.HasThumbnail(pid)) {
					var cl, fStyle, rc = api.Memory("RECT");
					rc.Left = LVIR_ICON;
					api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
					var state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Addons.SmallThumbs.fStyle);
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
					if (bThumb) {
						return S_OK;
					}
				}
			}
		}
	}, true);

	AddEvent("NavigateComplete", Addons.SmallThumbs.Clear);

	AddEvent("Command", Addons.SmallThumbs.Clear2);

	AddEvent("IconSizeChanged", Addons.SmallThumbs.Clear2);

	if (api.IsAppThemed() && WINVER >= 0x600) {
		AddEvent("Load", function () {
			if (!Addons.ClassicStyle) {
				Addons.SmallThumbs.fStyle = LVIS_CUT;
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
