AddEvent(Common.Paste.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.Paste.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.Paste.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.Paste.Exec", arguments);
		return S_OK;
	}
	return nPos;
});
