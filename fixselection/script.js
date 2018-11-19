if (window.Addon == 1) {
	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		Ctrl.Data.Selected = null;
	});

	AddEvent("SelectionChanged", function (Ctrl, uChange)
	{
		if (Ctrl.Type <= CTRL_EB && Ctrl.Data) {
			var Selected = Ctrl.SelectedItems();
			if (Selected.Count == 0) {
				setTimeout(function ()
				{
					if (Ctrl.Data) {
						Ctrl.Data.Selected = Ctrl.SelectedItems();
					}
				}, 99);
				return;
			}
			Ctrl.Data.Selected = Selected;
		}
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
