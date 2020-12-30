AddEvent(Common.CloseDuplicateTabs.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.CloseDuplicateTabs.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.CloseDuplicateTabs.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.CloseDuplicateTabs.Exec", Array.apply(null, arguments));
		return S_OK;
	}
	return nPos;
});
