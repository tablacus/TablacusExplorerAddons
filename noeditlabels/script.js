if (window.Addon == 1) {
	AddEvent("BeginLabelEdit", function (Ctrl, Name)
	{
		if (Ctrl.Type <= CTRL_EB) {
			return 1;
		}
	}, true);
}