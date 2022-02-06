Sync.FixWin11Preview = {
	rc: api.Memory("RECT")
}

AddEvent("ToolTip", function (Ctrl, Index, hwnd) {
	if (Ctrl.Type <= CTRL_EB) {
		if (Index >= 0) {
			const hList = Ctrl.hwndList;
			if (hList) {
				Sync.FixWin11Preview.hList = hList;
				Sync.FixWin11Preview.rc.left = LVIR_SELECTBOUNDS;
				api.SendMessage(hList, LVM_GETITEMRECT, Index, Sync.FixWin11Preview.rc);
			}
		}
	} else if (Ctrl.Type == CTRL_TE) {
		if (Index == WM_PAINT) {
			Sync.FixWin11Preview.hwnd = hwnd;
		}
	}
}, true);

AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
	if (msg == WM_MOUSEMOVE && Sync.FixWin11Preview.hwnd) {
		const hList = Ctrl.hwndList;
		if (hList && hList == Sync.FixWin11Preview.hList) {
			if (api.IsWindowVisible(Sync.FixWin11Preview.hwnd)) {
				const ptc = pt.Clone();
				api.ScreenToClient(hList, ptc);
				if (!PtInRect(Sync.FixWin11Preview.rc, ptc)) {
					api.ShowWindow(Sync.FixWin11Preview.hwnd, SW_HIDE);
					Sync.FixWin11Preview.hwnd = 0;
				}
			} else {
				Sync.FixWin11Preview.hwnd = 0;
			}
		}
	}
});
