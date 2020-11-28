AddEvent(Common.AddFavorites.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.AddFavorites.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.AddFavorites.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.AddFavorites.Exec", arguments);
		return S_OK;
	}
	return nPos;
});
