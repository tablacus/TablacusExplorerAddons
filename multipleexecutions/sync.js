Sync.MultipleExecutions = {
	Always: GetAddonOptionEx("multipleexecutions", "Always")
}

AddEvent("CopyData", function (Ctrl, cd, wParam) {
	if (Ctrl.Type == CTRL_TE && cd.dwData == 0 && cd.cbData) {
		if (Sync.MultipleExecutions.Always || api.CommandLineToArgv(api.SysAllocStringByteLen(cd.lpData, cd.cbData, cd.cbData)).length > 1) {
			SaveConfig();
			return S_FALSE;
		}
	}
});

AddType("Open in new window", {
	Exec: function (Ctrl, s, type, hwnd, pt) {
		wsh.Run(PathQuoteSpaces(api.GetModuleFileName(null)) + ' "Tabs,Close all tabs" ' + ExtractMacro(te, s));
		return S_OK;
	},

	Ref: function (path) {
		return OpenDialog(path);
	}
});
