if (window.Addon == 1) {
	AddEvent("MouseMessage", function(Ctrl, hwnd, msg, wParam, pt)
	{
		if (msg == WM_RBUTTONDOWN) {
			if (Ctrl.Type <= CTRL_EB && api.PathMatchSpec(api.GetClassName(hwnd), WC_LISTVIEW + ";DirectUIHWND")) {
				if (Ctrl.ItemCount(SVGIO_SELECTION)) {
					if (Ctrl.hwndList) {
 						var iItem = Ctrl.HitTest(pt, LVHT_ONITEM);
						var item = api.Memory("LVITEM");
						item.stateMask = LVIS_SELECTED;
						te.Data.Conf_Gestures = api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, iItem, LVIS_SELECTED) ? 2 : 3;
					} else {
						te.Data.Conf_Gestures = 2;
					}
				} else {
					te.Data.Conf_Gestures = 3;
				}
			}
		}
	});
}
