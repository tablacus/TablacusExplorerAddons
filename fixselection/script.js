if (window.Addon == 1) {
	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		Ctrl.Data.Selected = null;
	});

	AddEvent("SelectionChanged", function (Ctrl, uChange)
	{
		try {
			var Selected = Ctrl.SelectedItems();
			if (Selected.Count == 0) {
				if (api.SendMessage(Ctrl.hwndList, LVM_GETNEXTITEM, -1,  LVNI_ALL | LVNI_SELECTED)) {
					return;
				}
			}
			Ctrl.Data.Selected = Selected;
		} catch (e) {}
	});

	AddEvent("Sort", function (Ctrl)
	{
		var Selected = Ctrl.Data.Selected;
		if (Selected) {
			Ctrl.SelectItem(null, SVSI_DESELECTOTHERS);
			for (var i = Selected.Count; i--;) {
				Ctrl.SelectItem(Selected.Item(i), SVSI_SELECT);
			}
		}
	});
}
