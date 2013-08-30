if (window.Addon == 1) {
	Addons.FullRowSelectEx =
	{
		hwnd: -1,
		tid: null,

		Exec: function (Ctrl)
		{
			var hView = Ctrl && Ctrl.hwndView;
			if (hView != this.hwnd) {
				var hList = api.FindWindowEx(this.hwnd, 0, WC_LISTVIEW, null);
				if (hList) {
					api.PostMessage(hList, LVM_SETEXTENDEDLISTVIEWSTYLE, 0, api.SendMessage(hList, LVM_GETEXTENDEDLISTVIEWSTYLE, 0, 0) | LVS_EX_FULLROWSELECT);
					Addons.FullRowSelectEx.hwnd = -1;
					clearTimeout(this.tid);
					this.tid = null;
				}
				if (hView) {
					var hList = api.FindWindowEx(hView, 0, WC_LISTVIEW, null);
					if (hList) {
						api.PostMessage(hList, LVM_SETEXTENDEDLISTVIEWSTYLE, 0, api.SendMessage(hList, LVM_GETEXTENDEDLISTVIEWSTYLE, 0, 0) & (~LVS_EX_FULLROWSELECT));
						this.hwnd = hView;
						this.tid = setTimeout(this.Timeout, 1000);
					}
				}
			}
		},

		Timeout: function ()
		{
			var pt = api.Memory("POINT");
			api.GetCursorPos(pt);
			var Ctrl = te.CtrlFromPoint(pt);
			if ((Ctrl && Ctrl.hwndView) != Addons.FullRowSelectEx.hwnd) {
				Addons.FullRowSelectEx.Exec(Ctrl);
			}
			else {
				Addons.FullRowSelectEx.tid = setTimeout(Addons.FullRowSelectEx.Timeout, 1000);
			}
		}
	}
	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo)
	{
		Addons.FullRowSelectEx.Exec(Ctrl);
	});

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		Addons.FullRowSelectEx.Exec(Ctrl);
	});
}
