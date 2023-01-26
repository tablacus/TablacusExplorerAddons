Sync.GoHomeAuto = {
	Exec: function (FV) {
		if (FV && FV.Data.Home != null && !GetLock(FV)) {
			NavigateFV(FV, FV.Data.Home, SBSP_SAMEBROWSER);
		}
	}
}

AddEvent("SelectionChanged", function (Ctrl, uChange) {
	if (Ctrl.Type == CTRL_TC) {
		for (let i = Ctrl.length; i--;) {
			if (i != Ctrl.SelectedIndex) {
				Sync.GoHomeAuto.Exec(Ctrl[i]);
			}
		}
	}
});

AddEvent("VisibleChanged", function (Ctrl, Visible) {
	if (!Visible) {
		if (Ctrl.Type == CTRL_TC) {
			Sync.GoHomeAuto.Exec(Ctrl.Selected);
		}
	}
});
