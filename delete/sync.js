AddEvent(Common.Delete.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.Delete.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.Delete.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.Delete.Exec", Array.apply(null, arguments));
		return S_OK;
	}
	return nPos;
});
