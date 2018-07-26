if (window.Addon == 1) {
	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		var hr;
		var TC = Ctrl.Parent;
		for (var i = TC.Count; i-- > 0;) {
			var Item = TC.Item(i);
			if (Item.Data.Lock && Ctrl.hwnd != Item.hwnd && api.ILIsEqual(Ctrl.FolderItem, Item.FolderItem)) {
				if (!(wFlags & SBSP_ACTIVATE_NOFOCUS) || TC.Selected.hwnd == Ctrl.hwnd) {
					var Selected = Ctrl.SelectedItems();
					TC.SelectedIndex = i;
					if (Selected.Count == 1) {
						setTimeout(function () {
							Item.SelectItem(Selected.Item(0), SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_NOTAKEFOCUS | SVSI_DESELECTOTHERS | SVSI_SELECT);
						}, 99);
					}
				}
				hr = E_ABORT;
			}
		}
		return hr;
	});
}
