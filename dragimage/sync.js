AddEvent("DragImage", function (Ctrl, dataObj, di) {
	const sfi = SHGetFileInfo(dataObj && dataObj.Count ? dataObj.Item(0) : dataObj, 0, SHGFI_SYSICONINDEX | SHGFI_PIDL);
	const hIcon = GetHICON(sfi.iIcon, 48, ILD_NORMAL);
	if (hIcon) {
		di.DragImage = api.CreateObject("WICBitmap").FromHICON(hIcon);
		di.ptOffset = { x: di.DragImage.GetWidth() / 2, y : di.DragImage.GetHeight() - 6 };
		api.DestroyIcon(hIcon);
		if (dataObj.Count > 1) {
			const hBM = di.DragImage.GetHBITMAP(-6);
			const hdc = api.GetDC(te.hwnd);
			const hmdc = api.CreateCompatibleDC(hdc);
			const hOld = api.SelectObject(hmdc, hBM);
			api.SetTextColor(hmdc, 0xffffff);
			api.SetBkColor(hmdc, 0xff8000);
			const lf = api.Memory("LOGFONT");
			lf.lfFaceName = "Arial Black",
			lf.lfHeight = -12;
			lf.lfWeight = 700;
			const hFont = CreateFont(lf);
			const hfontOld = api.SelectObject(hmdc, hFont);
			const rc = api.Memory("RECT");
			rc.right = 48;
			rc.bottom = 48;
			rc.top = 16;
			api.DrawText(hmdc, String(dataObj.Count), -1, rc, DT_CALCRECT);
			rc.left = 21 - rc.right / 2;
			rc.right += rc.left + 5;
			--rc.top;
			++rc.bottom;
			api.FillRect(hmdc, rc, null, 0xffffffff);
			++rc.left;
			--rc.right;
			++rc.top;
			--rc.bottom;
			api.FillRect(hmdc, rc, null, 0xffff8000);
			api.DrawText(hmdc, String(dataObj.Count), -1, rc, DT_CENTER);
			api.SelectObject(hmdc, hfontOld);
			api.SelectObject(hmdc, hOld);
			api.DeleteDC(hmdc);
			di.DragImage.FromHBITMAP(hBM);
			api.DeleteObject(hBM);
			api.ReleaseDC(te.hwnd, hdc);
		}
		return S_OK;
	}
}, true);

te.DragIcon &= ~0x80000000;
