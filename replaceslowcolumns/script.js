if (window.Addon == 1) {
	Addons.ReplaceSlowColumns = {
		ItemDate: '"' + await api.PSGetDisplayName("{F7DB74B4-4287-4103-AFBA-F1B13DCD75CF} 100") + '"',
		DateModified: '"' + await api.PSGetDisplayName("{B725F130-47EF-101A-A5F1-02608C9EEBAC} 14") + '"',

		Exec: async function (Ctrl) {
			const s = await Ctrl.Columns;
			if (s.indexOf(Addons.ReplaceSlowColumns.ItemDate) >= 0 && s.indexOf(Addons.ReplaceSlowColumns.DateModified) < 0) {
				Ctrl.Columns = s.replace(Addons.ReplaceSlowColumns.ItemDate, Addons.ReplaceSlowColumns.DateModified);
			}
		}
	};
	if (Addons.ReplaceSlowColumns.ItemDate != '""') {
		AddEvent("NavigateComplete", Addons.ReplaceSlowColumns.Exec);
		AddEvent("ColumnsChanged", Addons.ReplaceSlowColumns.Exec);
	}
}
