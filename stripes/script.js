var Addon_Id = "stripes";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Stripes =
	{
		tid: {},
		db: {},

		Arrange: function (Ctrl, nDog) {
			delete Addons.Stripes.tid[Ctrl.hwnd];
			var hwnd = Ctrl.hwndList;
			if (hwnd) {
				var lvbk = api.Memory("LVBKIMAGE");
				if (Ctrl.CurrentViewMode == FVM_DETAILS && !api.SendMessage(hwnd, LVM_GETGROUPCOUNT, 0, 0) && !api.SendMessage(hwnd, LVM_HASGROUP, 9425, 0)) {
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
					if (nHeight > 0 && w > 0 && h > 0) {
						if (Addons.Stripes.db[hwnd] != h * 65536 + w) {
							Addons.Stripes.db[hwnd] = h * 65536 + w;
							var image = api.CreateObject("WICBitmap").Create(w, h);
							var cl2 = Addons.Stripes.GetBGRA(Addons.Stripes.Color, Addons.Stripes.Alpha);
							for (var i = 0; i < h; i += nHeight * 2) {
								image.FillRect(0, i, w, nHeight, cl2);
							}
							lvbk.hbm = image.GetHBITMAP(-2);
							lvbk.ulFlags = LVBKIF_TYPE_WATERMARK | LVBKIF_FLAG_ALPHABLEND;
							if (!api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk)) {
								api.DeleteObject(lvbk.hbm);
							}
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

		Arrange2: function (Ctrl) {
			if (Ctrl) {
				if (Ctrl.Type == CTRL_TE) {
					Ctrl = te.Ctrl(CTRL_FV);
					if (!Ctrl) {
						return;
					}
				}
				if (Ctrl.Type == CTRL_SB) {
					Addons.Stripes.Arrange(Ctrl);
					if (!Addons.Stripes.tid[Ctrl.hwnd]) {
						Addons.Stripes.tid[Ctrl.hwnd] = setTimeout(function () {
							Addons.Stripes.Arrange(Ctrl);
						}, 99);
					}
				}
			}
		},

		Arrange3: function (Ctrl) {
			setTimeout(function () {
				var cTC = te.Ctrls(CTRL_TC);
				for (var i in cTC) {
					var TC = cTC[i];
					if (TC && TC.Visible) {
						Addons.Stripes.Arrange(TC.Selected);
					}
				}
			}, 99);
		},

		GetBGRA: function (c, a) {
			return ((c & 0xff) << 16) | (c & 0xff00) | ((c & 0xff0000) >> 16) | a << 24;
		},

		Retry: function (Ctrl, nDog) {
			nDog = (nDog || 0) + 1;
			if (nDog < 9) {
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

	Addons.Stripes.Color = GetWinColor(item.getAttribute("Color2") || "#cccccc");
	Addons.Stripes.Alpha = (item.getAttribute("Alpha") & 0xff) || 128;
	AddEvent("NavigateComplete", Addons.Stripes.Arrange);
	AddEvent("Command", Addons.Stripes.Arrange2);
	AddEvent("IconSizeChanged", Addons.Stripes.Arrange);
	AddEvent("Arrange", Addons.Stripes.Arrange3);
	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
		Addons.Stripes.Arrange2(te.CtrlFromWindow(hwnd));
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
