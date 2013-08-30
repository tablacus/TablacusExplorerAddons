if (Addon == 1) {
	AddEvent("ChangeView", function(Ctrl)
	{
		try {
			api.SetWindowText(te.hwnd, Ctrl.Title + ' - Tablacus Explorer');
		} catch (e) {}
	});
}
