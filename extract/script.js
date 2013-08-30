if (window.Addon == 1) {
	AddEvent("Extract", function (Src, Dest)
	{
		var items = te.Data.Addons.getElementsByTagName("extract");
		if (items.length) {
			var item = items[0];
			var s = item.getAttribute("Path");
			if (s) {
				return wsh.Run(ExtractMacro(te, s.replace(/%src%/i, api.PathQuoteSpaces(Src)).replace(/%dest%|%dist%/i, api.PathQuoteSpaces(Dest))), 1, true);
			}
		}
	});
}
