AddEvent(Common.Restart.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.Restart.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.Restart.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.Restart.Exec", Array.apply(null, arguments));
		return S_OK;
	}
	return nPos;
});
