if (window.Addon == 1) {
	Addons.RemoveStatusColumn = {
		Status: '"' + await api.PSGetDisplayName("System.StorageProviderUIStatus") + '"',

		Exec: async function (Ctrl) {
			const s = await Ctrl.Columns;
			if (s.indexOf(Addons.RemoveStatusColumn.Status) >= 0) {
				var re = new RegExp(Addons.RemoveStatusColumn.Status + " \\d+", "g");
				Ctrl.Columns = s.replace(re, "");
			}
		}
	};

	if (Addons.RemoveStatusColumn.Status != '""') {
		AddEvent("NavigateComplete", Addons.RemoveStatusColumn.Exec);
		AddEvent("ColumnsChanged", Addons.RemoveStatusColumn.Exec);
	}
}