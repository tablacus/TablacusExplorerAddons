if (window.Addon == 1) {
	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		var hr;
		var db = {};
		var TC = Ctrl.Parent;
		for (var i = TC.Count; i-- > 0;) {
			var Item = TC.Item(i);
			if (Ctrl.hwnd != Item.hwnd && api.ILIsEqual(Ctrl.FolderItem, Item.FolderItem)) {
				if (Item.Data.Lock) {
					if (!(wFlags & SBSP_ACTIVATE_NOFOCUS) || TC.Selected.hwnd == Ctrl.hwnd) {
						(function (TC, i, Item, Selected) { setTimeout(function () {
							TC.SelectedIndex = i;
							if (Selected && Selected.Count == 1) {
								Item.SelectItem(Selected.Item(0), SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_NOTAKEFOCUS | SVSI_DESELECTOTHERS | SVSI_SELECT);
							}
						}, 99);}) (TC, Ctrl.Index < i ? i - 1 : i, Item, Ctrl.SelectedItems());
					}
					hr = E_ABORT;
				} else if (!hr) {
					Item.Close();
				}
			}
			var path = api.GetDisplayNameOf(Item, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
			if (db[path]) {
				db[path].push(Item);
			} else {
				db[path] = [Item];
			}
		}
		setTimeout(function ()
		{
			var SelectedIndex = TC.SelectedIndex;
			for (var i in db) {
				var cFV = db[i];
				var bSelected = false;
				for (var j = cFV.length; cFV.length > 1 && j-- > 0;) {
					var FV = cFV[j];
					var nIndex = FV.Index;
					if (FV.Close()) {
						cFV.splice(j, 1);
						bSelected |= nIndex == SelectedIndex;
					}
				}
				if (bSelected) {
					TC.SelectedIndex = cFV[0].Index;
				}
			}
		}, 99);
		return hr;
	}, true);

	if (!HOME_PATH) {
		HOME_PATH = ssfRECENT;
	}
}
