var Addon_Id = "stripes";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("Color2", api.sscanf("ececec", "%x"));
	}
}
if (window.Addon == 1) {
	Addons.Stripes =
	{
		tid: {},

		Arrange: function (Ctrl, nDog)
		{
			delete Addons.Stripes.tid[Ctrl.hwnd];
			var hWnd = Ctrl.hwndList;
			var R = api.Memory("RECT");
			api.SendMessage(hWnd, LVM_GETITEMRECT, 0, R);
			var nHeight = R.Bottom - R.Top;
			if (nHeight > 0) {
				var lvbk = api.Memory("LVBKIMAGE");
				if (Ctrl.CurrentViewMode == FVM_DETAILS && !api.SendMessage(hWnd, LVM_GETGROUPCOUNT, 0, 0) && !api.SendMessage(hWnd, LVM_HASGROUP, 9425, 0)) {
					var pszImage = api.Memory("WCHAR", 1024);
					lvbk.pszImage = pszImage;
					lvbk.cchImageMax = pszImage.Size;
					lvbk.ulFlags = LVBKIF_SOURCE_URL;
					api.SendMessage(hWnd, LVM_GETBKIMAGE, 0, lvbk);
					if (pszImage[0] == 0) {
						var hdc = api.GetDC(hWnd);
						var hMemDC = api.CreateCompatibleDC(hdc);
						var hBitmap = api.CreateCompatibleBitmap(hdc, 1, nHeight * 2);
						api.ReleaseDC(hWnd, hdc);
						api.SelectObject(hMemDC, hBitmap);
						api.MoveToEx(hMemDC, 0, 0, null);
						var pen1 = api.CreatePen(PS_SOLID, 1, api.SendMessage(hWnd, LVM_GETBKCOLOR, 0, 0));
						var hOld = api.SelectObject(hMemDC, pen1);
						api.LineTo(hMemDC, 0, nHeight);
						api.DeleteObject(pen1);
						pen1 = api.CreatePen(PS_SOLID, 1, Addons.Stripes.Color);
						api.SelectObject(hMemDC, pen1);
						api.LineTo(hMemDC, 0, nHeight * 2);
						api.SelectObject(hMemDC, hOld);

						var image = te.GdiplusBitmap();
						image.FromHBITMAP(hBitmap);

						lvbk.pszImage = image.DataURI("image/png");
						lvbk.ulFlags = LVBKIF_SOURCE_URL | LVBKIF_FLAG_TILEOFFSET | LVBKIF_STYLE_TILE;
						lvbk.yOffsetPercent = osInfo.dwMajorVersion >= 6 ? nHeight * 2 - R.Top : 0;
						api.SendMessage(hWnd, LVM_SETBKIMAGE, 0, lvbk);
						api.DeleteObject(hBitmap);
						api.DeleteObject(hMemDC);
					}
					if (Addons.Stripes.NoEm) {
						api.SendMessage(hWnd, LVM_SETSELECTEDCOLUMN, -1, 0);
					}
				}
				else {
					lvbk.ulFlags = LVBKIF_SOURCE_NONE ;
					api.SendMessage(hWnd, LVM_SETBKIMAGE, 0, lvbk);
				}
			}
			else {
				nDog = api.LowPart(nDog) + 1;
				if (nDog < 9) {
					Addons.Stripes.tid[Ctrl.hwnd] = setTimeout(function () {
						Addons.Stripes.Arrange(Ctrl, nDog)
					}, nDog * 100);
				}
			}
		},

		Arrange2: function (Ctrl)
		{
			if (Ctrl) {
				if (Ctrl.Type == CTRL_TE) {
					Ctrl = te.Ctrl(CTRL_FV);
					if (!Ctrl) {
						return;
					}
				}
				if (Ctrl.Type <= CTRL_EB) {
					Addons.Stripes.Arrange(Ctrl);
					if (!Addons.Stripes.tid[Ctrl.hwnd]) {
						Addons.Stripes.tid[Ctrl.hwnd] = setTimeout(function ()
						{
							Addons.Stripes.Arrange(Ctrl);
						}, 100);
					}
				}
			}
		}
	}

	if (item) {
		Addons.Stripes.Color = item.getAttribute("Color2");
		Addons.Stripes.NoEm = !api.LowPart(item.getAttribute("Em"));
	}

	AddEvent("NavigateComplete", Addons.Stripes.Arrange);
	AddEvent("Command", Addons.Stripes.Arrange2);

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		Addons.Stripes.Arrange2(te.CtrlFromWindow(hwnd));
	});

	if (Addons.Stripes.NoEm) {
		AddEvent("SystemMessage", function (Ctrl, hwnd, msg, wParam, lParam)
		{
			if (Ctrl.Type <= CTRL_EB) {
				if (msg == WM_NOTIFY) {
					var hWnd = Ctrl.hwndList;
					if (api.SendMessage(hWnd, LVM_GETSELECTEDCOLUMN, 0, 0) >= 0) {
						api.PostMessage(hWnd, LVM_SETSELECTEDCOLUMN, -1, 0);
						Addons.Stripes.Arrange2(Ctrl);
					}
				}
			}
		});
	}

	AddEvent("AddonDisabled", function(Id)
	{
		if (api.strcmpi(Id, "stripes") == 0) {
			AddEventEx(window, "beforeunload", function ()
			{
				var cFV = te.Ctrls(CTRL_FV);
				var lvbk = api.Memory("LVBKIMAGE");
				lvbk.ulFlags = LVBKIF_SOURCE_NONE ;
				for (var i in cFV) {
					var hWnd = cFV[i].hwndList;
					if (hWnd) {
						api.SendMessage(hWnd, LVM_SETBKIMAGE, 0, lvbk);
					}
				}
			});
		}
	});

	var cFV = te.Ctrls(CTRL_FV);
	var lvbk = api.Memory("LVBKIMAGE");
	lvbk.ulFlags = LVBKIF_SOURCE_NONE ;
	for (var i in cFV) {
		var hWnd = cFV[i].hwndList;
		if (hWnd) {
			api.SendMessage(hWnd, LVM_SETBKIMAGE, 0, lvbk);
			Addons.Stripes.Arrange2(cFV[i]);
		}
	}
}
