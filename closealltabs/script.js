var Addon_Id = "closealltabs";

if (window.Addon == 1) {
	Addons.CloseAllTabs =
	{
		Exec: function () {
			var cFV = te.Ctrls(CTRL_FV);
			for (var i = cFV.Count; i--;) {
				cFV[i].Close();
			}
			return S_OK;
		},
	};
	//Type
	AddTypeEx("Add-ons", "Close all tabs", Addons.CloseAllTabs.Exec);
}
