if (window.Addon == 1) {
	SetGestureExec("List", "1", function ()
	{
		if (Ctrl.hwndList && Ctrl.FolderFlags & FWF_SINGLECLICKACTIVATE) {
			var Item = Ctrl.HitTest(pt);
			if (Item) {
				api.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
				api.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
				return S_OK;
			}
		}
	}, "Func", true);
}
