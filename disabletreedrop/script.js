if (window.Addon == 1) {
	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_TV) {
			pdwEffect.X = DROPEFFECT_NONE;
			return S_OK;
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_TV) {
			pdwEffect.X = DROPEFFECT_NONE;
			return S_OK;
		}
	});
	te.HookDragDrop(CTRL_TV, true);
}
