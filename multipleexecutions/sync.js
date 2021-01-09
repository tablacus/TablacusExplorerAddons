
AddEvent("CopyData", function (Ctrl, cd, wParam) {
	if (Ctrl.Type == CTRL_TE && cd.dwData == 0 && cd.cbData) {
		if (api.CommandLineToArgv(api.SysAllocStringByteLen(cd.lpData, cd.cbData, cd.cbData)).length > 1) {
			SaveConfig();
			return S_FALSE;
		}
	}
});
