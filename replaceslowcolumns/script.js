if (window.Addon == 1) {
	Addons.ReplaceSlowColumns =
	{
		ItemDate: '"' + api.PSGetDisplayName("{F7DB74B4-4287-4103-AFBA-F1B13DCD75CF} 100") + '"',
		DateModified: '"' + api.PSGetDisplayName("{B725F130-47EF-101A-A5F1-02608C9EEBAC} 14") + '"'
	};
	if (Addons.ReplaceSlowColumns.ItemDate != '""') {
		AddEvent("NavigateComplete", function (Ctrl)
		{
			var s = Ctrl.Columns;
			if (s.match(Addons.ReplaceSlowColumns.ItemDate)) {
				Ctrl.Columns = s.replace(Addons.ReplaceSlowColumns.ItemDate, Addons.ReplaceSlowColumns.DateModified);
			}
		});
	}
}
