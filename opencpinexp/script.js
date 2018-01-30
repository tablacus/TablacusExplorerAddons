if (window.Addon == 1) {
	AddEvent("UseExplorer", function (pid)
	{
		if (api.ILIsParent(g_pidlCP, pid, false)) {
			return true;
		}
	});
}
