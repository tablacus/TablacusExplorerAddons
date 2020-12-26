AddEvent(Common.ResetColumns.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.ResetColumns.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.ResetColumns.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.ResetColumns.Exec", Array.apply(null, arguments));
		return S_OK;
	}
	return nPos;
});
