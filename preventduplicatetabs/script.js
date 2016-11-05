if (window.Addon == 1) {
	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		var db = {};
		var TC = Ctrl.Parent;
		for (var i = TC.Count; i-- > 0;) {
			var Item = TC.Item(i);
			if (Ctrl.hwnd != Item.hwnd && api.ILIsEqual(Ctrl.FolderItem, Item.FolderItem)) {
				if (!(wFlags & SBSP_ACTIVATE_NOFOCUS) || TC.Selected.hwnd == Ctrl.hwnd) {
					(function (TC, cFV) { setTimeout(function () {
						for (var i = 2; i--;) {
							if (cFV[i].Close()) {
								TC.SelectedIndex = cFV[i ^ 1].Index;
								break;
							}
						}
					}, 99);}) (TC, [Ctrl, Item]);
					continue;
				}
				return E_FAIL;
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
	});

	if (!HOME_PATH) {
		HOME_PATH = ssfRECENT;
	}
}
