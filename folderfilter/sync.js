AddEvent("FilterChanged", function (Ctrl) {
	const res = /\.folder/i.exec(Ctrl.FilterView);
	if (res) {
		Ctrl.OnIncludeObject = function (Ctrl, Path1, Path2, Item) {
			const ext = IsFolderEx(Item) ? ".folder" : "";
			return PathMatchEx(Path1 + ext, Ctrl.FilterView) || (Path1 != Path2 && PathMatchEx(Path2 + ext, Ctrl.FilterView)) ? S_OK : S_FALSE;
		}
		return S_OK;
	}
});
