var item = GetAddonElement('thumbplus');

Addons.ThumbPlus = {
	FV: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,
	Filter: item.getAttribute("Filter") || "",

	Clear: function (Ctrl)
	{
		if (Ctrl.type <= CTRL_SB) {
			delete Addons.ThumbPlus.FV[Ctrl.Id];
		}
	},

	MakeDisable: function ()
	{
		var nDog = 50;
		var s;
		while (s = Addons.ThumbPlus.keys.shift()) {
			if (/^\./.test(s)) {
				try {
					var keys = RegEnumKey(HKEY_CLASSES_ROOT, s + "\\ShellEx");
					for (var j in keys) {
						if (api.PathMatchSpec(keys[j], "{E357FCCD-A995-4576-B01F-234630154E96};{BB2E617C-0920-11D1-9A0B-00C04FC2D6C1}")) {
							if (!new RegExp("\\*\\" + s, "i").test(Addons.ThumbPlus.Disable)) {
								Addons.ThumbPlus.Disable += ";*" + s.toLowerCase();
								break;
							}
						}
					}
				} catch (e) {}
				if (nDog-- < 0) {
					break;
				}
			}
		}
		if (Addons.ThumbPlus.keys.length) {
			setTimeout(Addons.ThumbPlus.MakeDisable, 99);			
		} else {
			Addons.ThumbPlus.Disable = Addons.ThumbPlus.Disable.replace(/^;/, "");
		}
	}
};

if (window.Addon == 1) {
	AddEvent("HandleIcon", function (Ctrl, pid)
	{
		if (Ctrl.IconSize > 32) {
			var db = Addons.ThumbPlus.FV[Ctrl.Id];
			if (!db) {
				Addons.ThumbPlus.FV[Ctrl.Id] = db = { "*": Ctrl.IconSize };
			}
			var path = pid.Path;
			if (api.PathMatchSpec(path, Addons.ThumbPlus.Priority) || (api.PathMatchSpec(path, Addons.ThumbPlus.Filter) && !api.PathMatchSpec(path, Addons.ThumbPlus.Disable))) {
				if (db[path]) {
					return /object/i.test(typeof db[path]) ? true : undefined;
				}
				var cx = Ctrl.IconSize * screen.logicalYDPI / 96;
				var image = te.WICBitmap().FromFile(path, cx);
				if (image) {
					db[path] = GetThumbnail(image, cx, true);
					return true;
				}
				db[path] = 1;
			}
		}
	}, true);

	AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd)
	{
		var hList = Ctrl.hwndList;
		if (hList && Ctrl.IconSize > 32) {
			var db = Addons.ThumbPlus.FV[Ctrl.Id];
			if (db) {
				var image = db[pid.Path];
				if (/object/i.test(typeof image)) {
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
					image = GetThumbnail(image, x, true);
					if (image) {
						image.DrawEx(nmcd.hdc, rc.Left + (rc.Right - rc.Left - image.GetWidth()) / 2, rc.Bottom - image.GetHeight(), 0, 0, cl, cl, fStyle);
						return S_OK;
					}
				}
			}
		}
	}, true);

	AddEvent("NavigateComplete", Addons.ThumbPlus.Clear);

	AddEvent("Command", Addons.ThumbPlus.Clear);

	AddEvent("IconSizeChanged", function (Ctrl)
	{
		var db = Addons.ThumbPlus.FV[Ctrl.Id];
		if (db) {
			if (db["*"] < Ctrl.IconSize) {
				Addons.ThumbPlus.Clear(Ctrl);
			}
		}
	});

	if (api.IsAppThemed() && WINVER >= 0x600) {
		AddEvent("Load", function ()
		{
			if (!Addons.ClassicStyle) {
				Addons.ThumbPlus.fStyle = LVIS_CUT;
			}
		});
	}

	var s = item.getAttribute("Priority");
	Addons.ThumbPlus.Priority = s ? "*.zip\\*;" + s : "*.zip\\*";

	Addons.ThumbPlus.Disable =  item.getAttribute("Disable") || "";
	var ar = [];
	te.WICBitMap().GetCodecInfo(1, 0, ar);
	for (var i in ar) {
		var ar2 = ar[i].split(/,/);
		for (var j in ar2) {
			if (!new RegExp("\\*\\" + ar2[j], "i").test(Addons.ThumbPlus.Disable)) {
				Addons.ThumbPlus.Disable += ";*" + ar2[j].toLowerCase();
			}
		}
	}
	Addons.ThumbPlus.keys = RegEnumKey(HKEY_CLASSES_ROOT, "").sort();
	setTimeout(Addons.ThumbPlus.MakeDisable, 99);
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}