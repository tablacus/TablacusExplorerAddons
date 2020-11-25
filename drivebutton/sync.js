AddEvent(Common.DriveButton.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.DriveButton.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.DriveButton.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.DriveButton.Exec", arguments);
		return S_OK;
	}
	return nPos;
});
