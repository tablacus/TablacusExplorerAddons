if (window.Addon == 1) {
	AddEvent("ChangeNotify", function (Ctrl, pidls)
	{
		if (pidls.lEvent & (SHCNE_RMDIR | SHCNE_UPDATEDIR)) {
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				var FV = cFV[i];
				if (pidls.lEvent & SHCNE_RMDIR) {
					if (api.ILIsParent(pidls[0], FV, false)) {
						FV.Close();
					}
					continue;
				}
				var path = api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				if (/^[A-Z]:\\|^\\/i.test(path)) {
					api.PathIsDirectory(function (hr, FV) {
						if (hr < 0) {
							FV.Close();
						}
					}, -1, path, FV);
				}
			}
		}
	});
}
