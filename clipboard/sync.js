Common.Clipboard = api.CreateObject("Object");
Common.Clipboard.rc = api.CreateObject("RECT");

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		InvokeUI("Addons.Clipboard.SetRect");
		return S_OK;
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		const ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		if (PtInRect(Common.Clipboard.rc, ptc)) {
			Common.Clipboard.grfKeyState = grfKeyState;
			pdwEffect[0] = (grfKeyState & MK_SHIFT) ? DROPEFFECT_MOVE : DROPEFFECT_COPY;
			MouseOver("Clipboard");
			return S_OK;
		}
		MouseOut("Clipboard");
	}
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		const ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		MouseOut();
		if (PtInRect(Common.Clipboard.rc, ptc)) {
			dataObj.dwEffect = (Common.Clipboard.grfKeyState & MK_SHIFT) ? DROPEFFECT_MOVE : DROPEFFECT_COPY | DROPEFFECT_LINK;
			api.OleSetClipboard(dataObj);
			return S_OK;
		}
	}
});

AddEvent("DragLeave", MouseOut);
