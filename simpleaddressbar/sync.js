AddEvent(Common.SimpleAddressBar.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.SimpleAddressBar.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.SimpleAddressBar.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.SimpleAddressBar.Exec", Array.apply(null, arguments));
		return S_OK;
	}
	return nPos;
});
