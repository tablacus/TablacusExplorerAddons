(function () {
	if (window.Addon == 1) {
		AddEvent("ListViewCreated", function(Ctrl)
		{
			var hList = api.FindWindowEx(Ctrl.hwndView, 0, WC_LISTVIEW, null);
			api.SendMessage(hList, LVM_SETEXTENDEDLISTVIEWSTYLE, 0, api.SendMessage(hList, LVM_GETEXTENDEDLISTVIEWSTYLE, 0, 0) | LVS_EX_GRIDLINES);
		});
		var cFV = te.Ctrls(CTRL_FV);
		for (var i in cFV) {
			var hWnd = cFV[i].hwndView;
			if (hWnd) {
				var hList = api.FindWindowEx(hWnd, 0, WC_LISTVIEW, null);
				api.SendMessage(hList, LVM_SETEXTENDEDLISTVIEWSTYLE, 0, api.SendMessage(hList, LVM_GETEXTENDEDLISTVIEWSTYLE, 0, 0) | LVS_EX_GRIDLINES);
			}
		}
	}
})();
