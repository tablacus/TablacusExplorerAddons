AddEvent(Common.Cut.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.Cut.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.Cut.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.Cut.Exec", arguments);
		return S_OK;
	}
	return nPos;
});
