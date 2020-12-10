AddEvent("Exec", function (Ctrl, s, type, hwnd, pt, dataObj, grfKeyState, pdwEffect, bDrop) {
	if (SameText(s, "Up") && SameText(type, "Tabs")) {
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			if (FV.FilterView || FV.OnIncludeObject) {
				FV.FilterView = null;
				FV.OnIncludeObject = null;
				setTimeout(FV.Refresh, 99);
				return S_OK;
			}
		}
	}
}, true);
