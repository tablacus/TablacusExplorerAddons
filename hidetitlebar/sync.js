AddEvent(Common.HideTitleBar.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.HideTitleBar.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.HideTitleBar.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.HideTitleBar.Exec", arguments);
		return S_OK;
	}
	return nPos;
});
