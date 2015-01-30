if (window.Addon == 1) {
	AddEvent("ChangeView", function (Ctrl)
	{
		var info = api.Memory("SHFILEINFO");
		api.SHGetFileInfo(Ctrl.FolderItem, 0, info, info.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_OPENICON | SHGFI_PIDL);
		api.SendMessage(te.hwnd, WM_SETICON, ICON_SMALL, info.hIcon);
	});
}
