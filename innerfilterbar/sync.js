AddEvent(Common.InnerFilterBar.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.InnerFilterBar.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.InnerFilterBar.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.InnerFilterBar.Exec", arguments);
		return S_OK;
	}
	return nPos;
});
