if (window.Addon == 1) {
	Addons.NoEmphasis =
	{
		Arrange: function (Ctrl) {
			if (Ctrl.Type <= CTRL_EB) {
				Ctrl.ViewFlags |= 8;
			}
		}
	}

	AddEvent("NavigateComplete", Addons.NoEmphasis.Arrange);
	AddEvent("Command", Addons.NoEmphasis.Arrange);
	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		Addons.NoEmphasis.Arrange(te.CtrlFromWindow(hwnd));
	});

	AddEventId("AddonDisabledEx", "NoEmphasis", function()
	{
		var cFV = te.Ctrls(CTRL_FV);
		for (var i in cFV) {
			cFV[i].ViewFlags &= ~8;
		}
	});

	var cFV = te.Ctrls(CTRL_FV);
	for (var i in cFV) {
		Addons.NoEmphasis.Arrange(cFV[i]);
	}
}
