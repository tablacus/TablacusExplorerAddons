Sync.CloseOnBack = {
	Back: g_basic.Func.Tabs.Cmd.Back
}

g_basic.Func.Tabs.Cmd.Back = function (Ctrl, pt) {
	const FV = GetFolderView(Ctrl, pt);
	if (FV) {
		const Log = FV.History;
		if (Log && Log.Index < Log.Count - 1) {
			return Sync.CloseOnBack.Back(Ctrl, pt);
		}
		return Exec(FV, "Close tab", "Tabs", 0, pt);
	}
}
