if (window.Addon == 1) {
	Addons.SwitchPane =
	{
		NextFV: function (Ctrl)
		{
			var TC = te.Ctrl(CTRL_TC);
			var cTC = te.Ctrls(CTRL_TC);
			var nId = TC.Id;
			var nLen = cTC.length;
			for (var i = nLen; i--;) {
				if (cTC[i].Id == nId) {
					nId = i;
					break;
				}
			}
			for (var i = (nId + 1) % nLen; i != nId; i = (i + 1) % nLen) {
				if (cTC[i].Visible) {
					return cTC[i].Selected;
				}
			}
		}
	},

	AddEnv("Other", function(Ctrl)
	{
		var FV = Addons.SwitchPane.NextFV(Ctrl);
		if (FV) {
			return api.PathQuoteSpaces(api.GetDisplayNameOf(FV, SHGDN_FORPARSING));
		}
	});

	AddTypeEx("Add-ons", "Switch to next pane", function (Ctrl)
	{
		var FV = Addons.SwitchPane.NextFV(Ctrl);
		if (FV) {
			return FV.Focus();
		}
	});
}
