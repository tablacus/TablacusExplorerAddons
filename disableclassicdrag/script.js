if (window.Addon == 1) {
	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB) {
			api.SetWindowTheme(Ctrl.hwndList, "explorer", null);
		}
	});

	AddEvent("DragLeave", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB && Addons.ClassicStyle) {
			api.SetWindowTheme(Ctrl.hwndList, null, null);
		}
	});

	te.HookDragDrop(CTRL_FV, true);
}
