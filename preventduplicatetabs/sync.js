AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
	let hr;
	const db = {};
	const TC = Ctrl.Parent;
	for (let i = TC.Count; i-- > 0;) {
		const Item = TC.Item(i);
		if (Ctrl.Id != Item.Id && api.ILIsEqual(Ctrl.FolderItem, Item.FolderItem) && Ctrl.FilterView == Item.FilterView) {
			if (CanClose(Item)) {
				if (!(wFlags & SBSP_ACTIVATE_NOFOCUS) || TC.Selected.Id == Ctrl.Id) {
					(function (TC, Item, Selected) {
						setTimeout(function () {
							TC.SelectedIndex = Item.Index;
							if (Selected && Selected.Count == 1) {
								Item.SelectItem(Selected.Item(0), SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_NOTAKEFOCUS | SVSI_DESELECTOTHERS | SVSI_SELECT);
							}
						}, 99);
					})(TC, Item, Ctrl.SelectedItems());
				}
				hr = E_ABORT;
			} else if (!hr) {
				Item.Close();
			}
		}
		const path = [api.GetDisplayNameOf(Item, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX), Item.FilterView].join("\n");
		if (db[path]) {
			db[path].push(Item);
		} else {
			db[path] = [Item];
		}
	}
	setTimeout(function () {
		const SelectedIndex = TC.SelectedIndex;
		for (let i in db) {
			const cFV = db[i];
			let bSelected = false;
			for (let j = cFV.length; cFV.length > 1 && j-- > 0;) {
				const FV = cFV[j];
				const nIndex = FV.Index;
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
