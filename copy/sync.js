AddEvent(Common.Copy.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.Copy.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.Copy.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.Copy.Exec", arguments);
		return S_OK;
	}
	return nPos;
});
