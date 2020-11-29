const Addon_Id = "samelockedtab";
const item = GetAddonElement(Addon_Id);

Sync.SameLockedTab = {
	Close: api.LowPart(item.getAttribute("Close")),
	Multi: api.LowPart(item.getAttribute("Multi"))
}

AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
	if (GetLock(Ctrl) || /search\-ms:.*?crumb=[^&]+/.test(Ctrl.FilterView)) {
		return;
	}
	let hr;
	const cTC = Sync.SameLockedTab.Multi ? te.Ctrls(CTRL_TC, true) : [Ctrl.Parent];
	const TC1 = Ctrl.Parent;
	for (let j = cTC.length; j--;) {
		const TC = cTC[j];
		for (let i = TC.Count; i-- > 0;) {
			const Item = TC[i];
			if (Item.Data.Lock && Ctrl.Id != Item.Id && api.ILIsEqual(Ctrl.FolderItem, Item.FolderItem)) {
				if (!(wFlags & SBSP_ACTIVATE_NOFOCUS) || TC.Selected.Id == Ctrl.Id) {
					(function (TC, Item, Selected) {
						setTimeout(function () {
							if (TC.Id != TC1.Id) {
								Item.Focus();
							}
							TC.SelectedIndex = Item.Index;
							if (Selected && Selected.Count == 1) {
								Item.SelectItem(Selected.Item(0), SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_NOTAKEFOCUS | SVSI_DESELECTOTHERS | SVSI_SELECT);
							}
						}, 99);
					})(TC, Item, Ctrl.SelectedItems());
				}
				hr = Sync.SameLockedTab.Close ? E_ABORT : E_FAIL;
			}
		}
	}
	return hr;
});
