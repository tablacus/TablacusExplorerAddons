if (window.Addon == 1) {
	AddEvent("ChangeNotify", function (Ctrl, pidls)
	{
		if (pidls.lEvent & SHCNE_RMDIR) {
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				var FV = cFV[i];
				if (api.ILIsParent(pidls[0], FV, false)) {
					FV.Close();
					continue;
				}
			}
		}
	});
}
