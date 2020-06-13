var Addon_Id = "stripes";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Stripes =
	{
		tid: {},
		db: {},
		Color: GetBGRA(GetWinColor(item.getAttribute("Color2") || "#cccccc"), (item.getAttribute("Alpha") & 0xff) || 128),

		Arrange: function (Ctrl, nDog) {
			var FV = GetFolderView(Ctrl);
			if (!FV) {
				return;
			}
			var hwnd = FV.hwndList;
			delete Addons.Stripes.tid[FV.hwnd];
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
						if (Addons.Stripes.db[hwnd] != h * 65536 + w) {
							Addons.Stripes.db[hwnd] = h * 65536 + w;
							var image = api.CreateObject("WICBitmap").Create(w, h);
							for (var i = 0; i < h; i += nHeight * 2) {
								image.FillRect(0, i, w, nHeight, Addons.Stripes.Color);
							}
							lvbk.hbm = image.GetHBITMAP(-2);
							lvbk.ulFlags = LVBKIF_TYPE_WATERMARK | LVBKIF_FLAG_ALPHABLEND;
							if (!api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk)) {
								api.DeleteObject(lvbk.hbm);
							}
							FV.ViewFlags |= 8;
						}
					} else {
						Addons.Stripes.Retry(Ctrl, nDog);
					}
				} else {
					delete Addons.Stripes.db[hwnd];
					lvbk.ulFlags = LVBKIF_TYPE_WATERMARK;
					api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk);
				}
			} else {
				Addons.Stripes.Retry(Ctrl, nDog);
			}
		},

		Retry: function (Ctrl, nDog) {
			nDog = api.LowPart(nDog) + 1;
			if (Ctrl && nDog < 9) {
				Addons.Stripes.tid[Ctrl.hwnd] = setTimeout(function () {
					Addons.Stripes.Arrange(Ctrl, nDog);
				}, nDog * 100);
			}
		},

		Resize: function (tm) {
			setTimeout(function () {
				var cFV = te.Ctrls(CTRL_FV, false);
				for (var i in cFV) {
					var hwnd = cFV[i].hwndList;
					if (hwnd) {
						Addons.Stripes.Arrange(cFV[i]);
					}
				}
			}, api.LowPart(tm) || 99);
		},

		Clear: function () {
			var lvbk = api.Memory("LVBKIMAGE");
			lvbk.ulFlags = LVBKIF_TYPE_WATERMARK;
			for (var hwnd in Addons.Stripes.db) {
				delete Addons.Stripes.db[hwnd];
				api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk);
			}
		}
	}

	AddEvent("ContentsChanged", Addons.Stripes.Arrange);
	AddEvent("IconSizeChanged", Addons.Stripes.Arrange);
	AddEvent("ViewModeChanged", Addons.Stripes.Arrange);
	AddEvent("Arrange", function (Ctrl) {
		setTimeout(function () {
			Addons.Stripes.Arrange(Ctrl.Selected);
		}, 99);
	});
	AddEventId("AddonDisabledEx", "stripes", Addons.Stripes.Clear);
	Addons.Stripes.Resize(5000);
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}
