AddEvent(Common.Favorites.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.Favorites.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.Favorites.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.Favorites.Exec", arguments);
		return S_OK;
	}
	return nPos;
});
