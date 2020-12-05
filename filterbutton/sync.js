AddEvent(Common.FilterButton.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.FilterButton.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.FilterButton.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.FilterButton.Exec", arguments);
		return S_OK;
	}
	return nPos;
});
