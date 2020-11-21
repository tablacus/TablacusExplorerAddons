var Addon_Id = "stripes";
var item = GetAddonElement(Addon_Id);

Sync.Stripes = {
	db: {},
	Color: GetBGRA(GetWinColor(item.getAttribute("Color2") || "#cccccc"), (item.getAttribute("Alpha") & 0xff) || 128),

	Arrange: function (Ctrl, nDog) {
		var FV = GetFolderView(Ctrl);
		if (!FV) {
			return;
		}
		var hwnd = FV.hwndList;
		InvokeUI("Addons.Stripes.DeleteTid", FV.hwnd);
		if (hwnd) {
			var lvbk = api.Memory("LVBKIMAGE");
			if (FV.CurrentViewMode == FVM_DETAILS && !api.SendMessage(hwnd, LVM_GETGROUPCOUNT, 0, 0) && !api.SendMessage(hwnd, LVM_HASGROUP, 9425, 0)) {
				var rc = api.Memory("RECT");
				api.SendMessage(hwnd, LVM_GETITEMRECT, 0, rc);
				var nHeight = rc.Bottom - rc.Top;
				api.GetWindowRect(hwnd, rc);
				var w = rc.right - rc.left, h = rc.bottom - rc.top - nHeight;
				var hHeader = api.SendMessage(hwnd, LVM_GETHEADER, 0, 0);
				api.GetWindowRect(hHeader, rc);
				h -= rc.bottom - rc.top;
				if (api.GetWindowLongPtr(hwnd, GWL_STYLE) & WS_HSCROLL) {
					h -= api.GetSystemMetrics(SM_CYHSCROLL);
				}
				if (FV.Type == CTRL_EB) {
					h -= 4;
				}
				if (nHeight > 0 && w > 0 && h > 0) {
					if (Sync.Stripes.db[hwnd] != h * 65536 + w) {
						Sync.Stripes.db[hwnd] = h * 65536 + w;
						var image = api.CreateObject("WICBitmap").Create(w, h);
						for (var i = 0; i < h; i += nHeight * 2) {
							image.FillRect(0, i, w, nHeight, Sync.Stripes.Color);
						}
						lvbk.hbm = image.GetHBITMAP(-2);
						lvbk.ulFlags = LVBKIF_TYPE_WATERMARK | LVBKIF_FLAG_ALPHABLEND;
						if (!api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk)) {
							api.DeleteObject(lvbk.hbm);
						}
						FV.ViewFlags |= 8;
					}
				} else {
					InvokeUI("Addons.Stripes.Retry", Ctrl, nDog || 0);
				}
			} else {
				delete Sync.Stripes.db[hwnd];
				lvbk.ulFlags = LVBKIF_TYPE_WATERMARK;
				api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk);
			}
		} else {
			InvokeUI("Addons.Stripes.Retry", Ctrl, nDog || 0);
		}
	},

	Resize: function (tm) {
		setTimeout(function () {
			var cFV = te.Ctrls(CTRL_FV, false);
			for (var i in cFV) {
				var hwnd = cFV[i].hwndList;
				if (hwnd) {
					Sync.Stripes.Arrange(cFV[i]);
				}
			}
		}, api.LowPart(tm) || 99);
	},

	Clear: function () {
		var lvbk = api.Memory("LVBKIMAGE");
		lvbk.ulFlags = LVBKIF_TYPE_WATERMARK;
		for (var hwnd in Sync.Stripes.db) {
			delete Sync.Stripes.db[hwnd];
			api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk);
		}
	}
}

AddEvent("ContentsChanged", Sync.Stripes.Arrange);
AddEvent("IconSizeChanged", Sync.Stripes.Arrange);
AddEvent("ViewModeChanged", Sync.Stripes.Arrange);
AddEventId("AddonDisabledEx", "stripes", Sync.Stripes.Clear);
Sync.Stripes.Resize(5000);
