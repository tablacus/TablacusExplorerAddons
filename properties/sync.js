AddEvent(Common.Properties.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.Properties.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.Properties.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.Properties.Exec", Array.apply(null, arguments));
		return S_OK;
	}
	return nPos;
});
