AddEvent(Common.WildcardSelect.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.WildcardSelect.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.WildcardSelect.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.WildcardSelect.Exec", Array.apply(null, arguments));
		return S_OK;
	}
	return nPos;
});
