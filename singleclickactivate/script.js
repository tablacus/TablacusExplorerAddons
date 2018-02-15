if (window.Addon == 1) {
	SetGestureExec("List", "1", function ()
	{
		if (Ctrl.hwndList && Ctrl.FolderFlags & FWF_SINGLECLICKACTIVATE) {
			var Item = Ctrl.HitTest(pt);
			if (Item) {
				var b = api.GetSystemMetrics(SM_SWAPBUTTON);
				api.mouse_event(b ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
				api.mouse_event(b ? MOUSEEVENTF_RIGHTUP : MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
				return S_OK;
			}
		}
	}, "Func", true);
}
