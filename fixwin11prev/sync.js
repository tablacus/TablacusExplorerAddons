Sync.FixWin11Preview = {
	rc: api.Memory("RECT")
}

AddEvent("ToolTip", function (Ctrl, Index) {
	const hList = Ctrl.hwndList;
	if (hList && Index >= 0) {
		api.GetCursorPos(Sync.FixWin11Preview.pt);
		Sync.FixWin11Preview.rc.left = LVIR_SELECTBOUNDS;
		api.SendMessage(hList, LVM_GETITEMRECT, Index, Sync.FixWin11Preview.rc);
		Sync.FixWin11Preview.hList = hList;
	}
}, true);

AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
	if (msg == WM_MOUSEMOVE && Ctrl.hwndList && Ctrl.hwndList == Sync.FixWin11Preview.hList) {
		let hwnd, hwnd1;
		while (hwnd1 = api.FindWindowEx(null, hwnd1, null, null)) {
			if (api.GetClassName(hwnd1) == "tooltips_class32") {
				if (api.IsWindowVisible(hwnd1)) {
					hwnd = hwnd1;
					break;
				}
			}
		}
		if (hwnd) {
			const ptc = pt.Clone();
			api.ScreenToClient(Sync.FixWin11Preview.hList, ptc);
			if (!PtInRect(Sync.FixWin11Preview.rc, ptc)) {
				api.ShowWindow(hwnd, SW_HIDE);
			}
		}
	}
});
