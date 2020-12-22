Sync.DragTop = {};

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (te.hwnd == api.GetForegroundWindow()) {
		Sync.DragTop.tm = void 0;
	} else {
		const tm = new Date().getTime();
		if (Sync.DragTop.tm) {
			if (tm - Sync.DragTop.tm > 500) {
				api.SetForegroundWindow(te.hwnd);
				Sync.DragTop.tm = void 0;
			}
		} else {
			Sync.DragTop.tm = tm;
		}
	}
}, true);

AddEvent("DragLeave", function () {
	Sync.DragTop.tm = void 0;
});
