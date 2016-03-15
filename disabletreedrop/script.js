if (window.Addon == 1) {
	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_TV) {
			pdwEffect[0] = DROPEFFECT_NONE;
			return S_OK;
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_TV) {
			pdwEffect[0] = DROPEFFECT_NONE;
			return S_OK;
		}
	});
}
