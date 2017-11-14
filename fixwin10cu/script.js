if (window.Addon == 1) {
	Addons.FixWin10CU =
	{
		tids: {},

		Exec: function (Ctrl, tm)
		{
			if (Addons.FixWin10CU.tids[Ctrl.Id]) {
				clearTimeout(Addons.FixWin10CU.tids[Ctrl.Id]);
				delete Addons.FixWin10CU.tids[Ctrl.Id];
			}
			if (Ctrl.Type != CTRL_SB) {
				return;
			}
			if (isNaN(tm) || !tm) {
				tm = 31;
			}
			var hList = Ctrl.hwndList;
			if (hList && api.IsWindowVisible(hList)) {
			 	if (api.SendMessage(hList, LVM_GETEDITCONTROL, 0, 0)) {
					tm = 498;
				} else {
					tm = 0;
					if (Ctrl.CurrentViewMode == FVM_DETAILS) {
						var pt = api.Memory("POINT");
						api.SendMessage(hList, LVM_GETORIGIN, 0, pt);
						if (pt.y < 0) {
							api.SendMessage(hList, LVM_SETVIEW, 2, 0);
							api.SendMessage(hList, LVM_SETVIEW, 1, 0);
						}
					}
					if (!(Ctrl.FolderFlags & FWF_NOCOLUMNHEADER)) {
						if (Ctrl.CurrentViewMode == FVM_DETAILS || !(Ctrl.FolderFlags & FWF_NOHEADERINALLVIEWS)) {
							var hHeader = api.SendMessage(hList, LVM_GETHEADER, 0, 0);
							if (hHeader) {
								var rc = api.Memory("RECT");
								if (api.GetWindowRect(hHeader, rc) && rc.top == rc.bottom) {
									api.SendMessage(hList, LVM_SCROLL, 0, 0);
								}
								if (api.GetWindowRect(hHeader, rc) && rc.top == rc.bottom) {
									api.ShowWindow(hList, SW_HIDE);
									api.ShowWindow(hList, SW_SHOWNA);
								}
							}
						}
					}
				}
			}
			if (tm > 0) {
				tm *= 2;
				if (tm < 999) {
					Addons.FixWin10CU.tids[Ctrl.Id] = setTimeout(function () {
						Addons.FixWin10CU.Exec(Ctrl, tm);
					}, tm);
				}
			}
		}
	};

	AddEvent("ChangeView", Addons.FixWin10CU.Exec);
	AddEvent("ColumnsChanged", Addons.FixWin10CU.Exec);
	AddEvent("EndLabelEdit", Addons.FixWin10CU.Exec);
	AddEvent("IconSizeChanged", Addons.FixWin10CU.Exec);
	AddEvent("Sort", Addons.FixWin10CU.Exec);

	AddEvent("ChangeNotify", function (Ctrl, pidls, wParam, lParam)
	{
		if (pidls.lEvent & SHCNE_DISKEVENTS) {
			var cTC = te.Ctrls(CTRL_TC);
			for (var i in cTC) {
				var TC = cTC[i];
				if (TC.Visible) {
					var FV = TC.Selected;
					if (api.ILIsParent(FV, pidls[0], true)) {
						Addons.FixWin10CU.Exec(FV);
					}
				}
			}
		}
	});

}
