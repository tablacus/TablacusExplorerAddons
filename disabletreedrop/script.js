if (window.Addon == 1) {
	AddEventEx(window, "load", function () {
		AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
			if (Ctrl.Type == CTRL_TV) {
				pdwEffect[0] = DROPEFFECT_NONE;
				return S_OK;
			}
		}, true);

		AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
			if (Ctrl.Type == CTRL_TV) {
				pdwEffect[0] = DROPEFFECT_NONE;
				return S_OK;
			}
		}, true);

		AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect, pgrfKeyState) {
			if (Ctrl.Type == CTRL_TV) {
				return S_OK;
			}
		}, true);
	});
}
