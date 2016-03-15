if (window.Addon == 1) {
	Addons.DragTop = {
		tid: null,
		pt: api.Memory("POINT")
	};

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (te.hwnd != api.GetForegroundWindow()) {
			if (IsDrag(pt, Addons.DragTop.pt)) {
				clearTimeout(Addons.DragTop.tid);
				Addons.DragTop.pt.x = pt.x;
				Addons.DragTop.pt.y = pt.y;
				Addons.DragTop.tid = setTimeout(function () {
					Addons.DragTop.tid = null;
					Addons.DragTop.pt.x = MAXINT;
					api.SetForegroundWindow(te.hwnd);
				}, 500);
			}
		}
	}, true);

	AddEvent("DragLeave", function (Ctrl)
	{
		clearTimeout(Addons.DragTop.tid);
		Addons.DragTop.tid = null;
	});
}
