ColumnsReplace(te, "{E3E0584C-B788-4A5A-BB20-7F5A44C9ACDD} 7", HDF_LEFT, function (FV, pid, s) {
	if (!s) {
		return pid.Path;
	}
});

ColumnsReplace(te, "{41CF5AE0-F75A-4806-BD87-59C7D9248EB9} 100", HDF_LEFT, function (FV, pid, s) {
	if (!s) {
		return GetFileName(pid.Path);
	}
});
