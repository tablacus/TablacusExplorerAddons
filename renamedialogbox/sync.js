AddEvent(Common.RenameDialogBox.strMenu, function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, Common.RenameDialogBox.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Common.RenameDialogBox.strName);
	ExtraMenuCommand[nPos] = function () {
		InvokeUI("Addons.RenameDialogBox.Exec", Array.apply(null, arguments));
		return S_OK;
	}
	return nPos;
});
