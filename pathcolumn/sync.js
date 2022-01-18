ColumnsReplace(te, "{E3E0584C-B788-4A5A-BB20-7F5A44C9ACDD} 7", HDF_LEFT, function (FV, pid, s) {
	if (!s) {
		return pid.Path;
	}
});
