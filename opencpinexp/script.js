if (window.Addon == 1) {

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (api.ILIsParent(g_pidlCP, Ctrl, false)) {
				(function (pid) { setTimeout(function () {
					OpenInExplorer(pid);
				}, 99);}) (Ctrl.FolderItem);
				return E_NOTIMPL;
			}
		}
	}, true);
	
	AddEvent("UseExplorer", function (FolderItem)
	{
		if (api.ILIsParent(g_pidlCP, FolderItem, false)) {
			return true;
		}
	});
}
