AddEvent(Common.SelectNonexistent.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.SelectNonexistent.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.SelectNonexistent.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.SelectNonexistent.Exec", Array.apply(null, arguments));
		return S_OK;
	}
	return nPos;
});
