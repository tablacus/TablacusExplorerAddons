if (window.Addon == 1) {
	AddEnv("Selected", function(Ctrl)
	{
		var ar = [];
		var FV = GetFolderView(Ctrl);
		if (FV) {
			var Selected = FV.Items(SVGIO_SELECTION | SVGIO_FLAG_VIEWORDER);
			if (Selected) {
				for (var i = Selected.Count; i > 0; ar.unshift(api.PathQuoteSpaces(api.GetDisplayNameOf(Selected.Item(--i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)))) {
				}
			}
		}
		return ar.join(" ");
	});
}
