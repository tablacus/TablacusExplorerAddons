AddEvent(Common.InnerAddressBar.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.InnerAddressBar.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.InnerAddressBar.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.InnerAddressBar.Exec", arguments);
		return S_OK;
	}
	return nPos;
});
