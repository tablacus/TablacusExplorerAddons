Sync.NewTabOnForward = {
	Forward: g_basic.Func.Tabs.Cmd.Forward
}

g_basic.Func.Tabs.Cmd.Forward = function (Ctrl, pt) {
	const FV = GetFolderView(Ctrl, pt);
	if (FV) {
		const Log = FV.History;
		if (Log && Log.Index > 0) {
			return Sync.CloseOnBack.Forward(Ctrl, pt);
		}
		return Exec(FV, "New tab", "Tabs", 0, pt);
	}
}
