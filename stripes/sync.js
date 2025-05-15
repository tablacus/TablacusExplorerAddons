const Addon_Id = "stripes";
let item = GetAddonElement(Addon_Id);

Sync.Stripes = {
	db: {},
	Color: GetBGRA(GetWinColor(item.getAttribute("Color2") || "#7f7f7f"), (item.getAttribute("Alpha") & 0xff) || 64),

	Arrange: function (Ctrl, nDog) {
		const FV = GetFolderView(Ctrl);
		if (!FV) {
			return;
		}
		const hwnd = FV.hwndList;
		InvokeUI("Addons.Stripes.DeleteTid", FV.hwnd);
		if (hwnd) {
			if (FV.CurrentViewMode == FVM_DETAILS && !api.SendMessage(hwnd, LVM_GETGROUPCOUNT, 0, 0) && !api.SendMessage(hwnd, LVM_HASGROUP, 9425, 0)) {
				const rc = api.Memory("RECT");
				api.SendMessage(hwnd, LVM_GETITEMRECT, 0, rc);
				const nHeight = rc.Bottom - rc.Top;
				api.GetWindowRect(hwnd, rc);
				let w = rc.right - rc.left, h = rc.bottom - rc.top - nHeight;
				api.GetWindowRect(api.SendMessage(hwnd, LVM_GETHEADER, 0, 0), rc);
				h -= rc.bottom - rc.top;
				if (api.GetWindowLongPtr(hwnd, GWL_STYLE) & WS_HSCROLL) {
					h -= api.GetSystemMetrics(SM_CYHSCROLL);
				}
				if (FV.Type == CTRL_EB) {
					h -= 4;
				}
				if (nHeight > 0 && w > 0 && h > 0) {
					if (Sync.Stripes.db[hwnd] != h * 65536 + w) {
						const image = api.CreateObject("WICBitmap").Create(w, h);
						if (image) {
							Sync.Stripes.db[hwnd] = h * 65536 + w;
							for (let i = 0; i < h; i += nHeight * 2) {
								image.FillRect(0, i, w, nHeight, Sync.Stripes.Color);
							}
							Sync.Stripes.SetImage(hwnd, LVBKIF_TYPE_WATERMARK | LVBKIF_FLAG_ALPHABLEND, image.GetHBITMAP(-2));
							FV.ViewFlags |= 8;
						}
					}
				} else {
					InvokeUI("Addons.Stripes.Retry", Ctrl, nDog || 0);
				}
			} else {
				delete Sync.Stripes.db[hwnd];
				Sync.Stripes.ClearImage(hwnd);
			}
		} else {
			InvokeUI("Addons.Stripes.Retry", Ctrl, nDog || 0);
		}
	},

	Resize: function (tm) {
		setTimeout(function () {
			const cFV = te.Ctrls(CTRL_FV, false);
			for (let i in cFV) {
				const hwnd = cFV[i].hwndList;
				if (hwnd) {
					Sync.Stripes.Arrange(cFV[i]);
				}
			}
		}, Number(tm) || 99);
	},

	SetImage: function (hwnd, ulFlags, hbm) {
		Sync.Stripes.ClearImage(hwnd);
		const lvbk = api.Memory("LVBKIMAGE");
		lvbk.ulFlags = ulFlags;
		lvbk.hbm = hbm;
		if (!api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk)) {
			if (hbm) {
				api.DeleteObject(hbm);
			}
		}
	},
	ClearImage: function (hwnd) {
		const lvbk = api.Memory("LVBKIMAGE");
		lvbk.ulFlags = LVBKIF_TYPE_WATERMARK;
		if (api.SendMessage(hwnd, LVM_GETBKIMAGE, 0, lvbk)) {
			if (lvbk.hbm) {
				api.DeleteObject(lvbk.hbm);
			}
		}
	},

	Unload: function (Ctrl, fs, wFlags, Prev) {
		const hwnd = Ctrl.hwndList;
		if (hwnd) {
			Sync.Stripes.ClearImage(hwnd);
		}
	},

	Clear: function () {
		for (let hwnd in Sync.Stripes.db) {
			delete Sync.Stripes.db[hwnd];
			Sync.Stripes.SetImage(hwnd, LVBKIF_TYPE_WATERMARK, null);
		}
	}
}
delete item;

AddEvent("ContentsChanged", Sync.Stripes.Arrange);
AddEvent("IconSizeChanged", Sync.Stripes.Arrange);
AddEvent("ViewModeChanged", Sync.Stripes.Arrange);
AddEvent("BeforeNavigate", Sync.Stripes.Unload, true);
AddEventId("AddonDisabledEx", "stripes", Sync.Stripes.Clear);
Sync.Stripes.Resize(5000);
