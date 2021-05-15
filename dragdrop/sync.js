const mode = GetAddonOptionEx("dragdrop", "Mode");
Common.DragDrop = mode == 1 ? MK_CONTROL : mode == 2 ? MK_SHIFT : 0;
if (Common.DragDrop) {
	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect, pgrfKeyState) {
		if (grfKeyState <= (MK_LBUTTON | MK_RBUTTON) && (dataObj.dwEffect & 7) == 7) {
			pgrfKeyState[0] |= Common.DragDrop;
		}
	}, true);
}
