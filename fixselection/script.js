if (window.Addon == 1) {
	Addons.FixSelection = {
		tid: {},

		Exec: function (FV)
		{
			delete Addons.FixSelection.tid[FV.Id];
			if (FV.Type == CTRL_SB && FV.Data) {
				var Selected = FV.Data.Selected;
				if (Selected && Selected.Count != FV.ItemCount(SVGIO_SELECTION)) {
					FV.SelectItem(null, SVSI_DESELECTOTHERS);
					for (var i = Selected.Count; i--;) {
						FV.SelectItem(Selected.Item(i), SVSI_SELECT);
					}
					delete FV.Data.Selected;
				}
			}
		},

		ChangeNotify: function (FV)
		{
			if (FV.Type == CTRL_SB && FV.Data && FV.Data.Selected) {
				if (Addons.FixSelection.tid[FV.Id]) {
					clearTimeout(Addons.FixSelection.tid[FV.Id]);
				}
				Addons.FixSelection.tid[FV.Id] = setTimeout(function ()
				{
					Addons.FixSelection.Exec(FV);
				}, 99)
			}
		}
	}

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		Ctrl.Data.Selected = null;
	});

	AddEvent("SelectionChanged", function (Ctrl, uChange)
	{
		if (Ctrl.Type == CTRL_SB && Ctrl.Data) {
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

	AddEvent("Sort", Addons.FixSelection.Exec);

	AddEvent("ChangeNotify", function (Ctrl, pidls, wParam, lParam)
	{
		var cFV = te.Ctrls(CTRL_FV);
		for (var i in cFV) {
			Addons.FixSelection.ChangeNotify(cFV[i]);
		}
	});
}