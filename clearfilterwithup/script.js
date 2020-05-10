if (window.Addon == 1) {
	AddEvent("Exec", function (Ctrl, s, type, hwnd, pt, dataObj, grfKeyState, pdwEffect, bDrop) {
		if (s === "Up" && type === "Tabs") {
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				if (FV.FilterView || FV.OnIncludeObject) {
					FV.FilterView = null;
					FV.OnIncludeObject = null;
					setTimeout(function () {
						FV.Refresh();
					}, 99);
					return S_OK;
				}
			}
		}
	}, true);
}
