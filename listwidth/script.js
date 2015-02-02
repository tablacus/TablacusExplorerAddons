var Addon_Id = "listwidth";

if (window.Addon == 1) {
	Addons.ListWidth = {
		Width: api.QuadPart(GetAddonOption("listwidth", "Width")),
		Exec: function (Ctrl)
		{
			if (Ctrl.CurrentViewMode == FVM_LIST) {
				var hList = Ctrl.hwndList;
				if (hList) {
					api.SendMessage(hList, LVM_SETCOLUMNWIDTH, 0, Addons.ListWidth.Width);
				}
			}
		}
	}
	if (Addons.ListWidth.Width > 30) {
		AddEvent("ListViewCreated", Addons.ListWidth.Exec);
		AddEvent("ViewModeChanged", Addons.ListWidth.Exec);
		var cFV = te.Ctrls(CTRL_FV);
		for (var i in cFV) {
			Addons.ListWidth.Exec(cFV[i]);
		}
	}
}
