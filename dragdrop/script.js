if (window.Addon == 1) {
	var mode = api.QuadPart(GetAddonOption("dragdrop", "Mode"));

	if (mode == 1) {
		AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect, pgrfKeyState)
		{
			if (grfKeyState <= (MK_LBUTTON | MK_RBUTTON)) {
				pgrfKeyState[0] |= MK_CONTROL;
			}
		}, true);
	}
	else if (mode == 2) {
		AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect, pgrfKeyState)
		{
			if (grfKeyState <= (MK_LBUTTON | MK_RBUTTON)) {
				pgrfKeyState[0] |= MK_SHIFT;
			}
		}, true);
	}

	te.HookDragDrop(CTRL_FV, true);
	te.HookDragDrop(CTRL_TV, true);
}
