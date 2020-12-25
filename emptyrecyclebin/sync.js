AddEvent(Common.EmptyRecycleBin.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.EmptyRecycleBin.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.EmptyRecycleBin.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.EmptyRecycleBin.Exec", Array.apply(null, arguments));
		return S_OK;
	}
	return nPos;
});
