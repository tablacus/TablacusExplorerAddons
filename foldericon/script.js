if (Addon == 1) {
	g_foldericon_ChangeView = window.ChangeView;
	window.ChangeView = function (Ctrl)
	{
		var info = api.Memory("SHFILEINFO");
		api.ShGetFileInfo(Ctrl.FolderItem, 0, info, info.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_OPENICON | SHGFI_PIDL);
		api.SendMessage(external.hwnd, WM_SETICON, ICON_SMALL, info.hIcon);
		if (g_foldericon_ChangeView) {
			return g_foldericon_ChangeView(Ctrl);
		}
		return S_OK;
	}
}
