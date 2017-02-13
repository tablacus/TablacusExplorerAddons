if (window.Addon == 1) {
	AddEvent("NavigateComplete", function(Ctrl)
	{
		api.SendMessage(Ctrl.hwndList, LVM_SETEXTENDEDLISTVIEWSTYLE, LVS_EX_GRIDLINES, LVS_EX_GRIDLINES);
	});

	AddEventId("AddonDisabledEx", "gridlines", function ()
	{
		var cFV = te.Ctrls(CTRL_FV);
		for (var i in cFV) {
			var hList = cFV[i].hwndList;
			if (hList) {
				api.SendMessage(hList, LVM_SETEXTENDEDLISTVIEWSTYLE, LVS_EX_GRIDLINES, 0);
			}
		}
	});

	var cFV = te.Ctrls(CTRL_FV);
	for (var i in cFV) {
		var hList = cFV[i].hwndList;
		if (hList) {
			api.SendMessage(hList, LVM_SETEXTENDEDLISTVIEWSTYLE, LVS_EX_GRIDLINES, LVS_EX_GRIDLINES);
		}
	}
}
