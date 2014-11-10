if (window.Addon == 1) {
	Addons.OpenCPinExp =
	{
		Path: ssfCONTROLS
	};

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (api.ILIsParent(Addons.OpenCPinExp.Path, Ctrl, false)) {
				(function (Path) { setTimeout(function () {
					var exp = te.CreateObject("new:{C08AFD90-F2A1-11D1-8455-00A0C91F3880}");
					exp.Navigate2(Path);
					exp.Visible = true;
				}, 100);}) (Ctrl.FolderItem);
				return E_NOTIMPL;
			}
		}
	}, true);
	
	AddEvent("Addons.OpenInstead", function (path)
	{
		if (api.ILIsParent(Addons.OpenCPinExp.Path, path, false)) {
			return S_FALSE;
		}
	});

	Addons.OpenCPinExp.Path = api.ILRemoveLastID(ssfCONTROLS);
	if (api.ILIsEmpty(Addons.OpenCPinExp.Path) || api.ILIsEqual(Addons.OpenCPinExp.Path, ssfDRIVES)) {
		Addons.OpenCPinExp.Path = ssfCONTROLS;
	}
}
