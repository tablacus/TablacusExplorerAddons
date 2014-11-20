if (window.Addon == 1) {
	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		api.SetForegroundWindow(te.hwnd);
	});
	te.HookDragDrop(CTRL_FV, true);
	te.HookDragDrop(CTRL_TV, true);
}
