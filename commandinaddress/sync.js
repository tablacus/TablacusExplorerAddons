AddEvent("LocationEntered2", function (FV, Path, wFlags) {
	if (api.GetKeyState(VK_SHIFT) < 0 || !api.PathIsDirectory(Path)) {
		try {
			wsh.CurrentDirectory = FV.FolderItem.Path;
		} catch (e) { }
		wsh.Run(Path);
		try {
			wsh.CurrentDirectory = GetTempPath(0);
		} catch (e) { }
		return S_OK;
	}
});
