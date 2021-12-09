Common.Delete = api.CreateObject("Object");
Common.Delete.rc = api.CreateObject("Object");

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		Common.Delete.rc = api.CreateObject("Object");
		InvokeUI("Addons.Delete.SetRect");
		return S_OK;
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		const ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		for (let id in Common.Delete.rc) {
			const rc = Common.Delete.rc[id];
			if (PtInRect(rc, ptc)) {
				MouseOver(id);
				return api.DropTarget(ssfBITBUCKET).DragOver(dataObj, grfKeyState, pt, pdwEffect);
			}
			MouseOut(id);
		}
	}
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		const ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		MouseOut();
		for (let id in Common.Delete.rc) {
			const rc = Common.Delete.rc[id];
			if (PtInRect(rc, ptc)) {
				return api.DropTarget(ssfBITBUCKET).Drop(dataObj, MK_LBUTTON, pt, pdwEffect);
			}
		}
	}
});

AddEvent("DragLeave", MouseOut);
