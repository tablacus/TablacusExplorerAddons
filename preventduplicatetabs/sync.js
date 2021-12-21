const Addon_Id = "preventduplicatetabs";
let item = GetAddonElement(Addon_Id);

Sync.PreventDuplicateTabs = {
	Exec: function (Ctrl, fs, wFlags, Prev) {
		InvokeUI("Addons.PreventDuplicateTabs.KillTimer");
		let hr;
		const TC = Ctrl.Parent;
		for (let i = TC.Count; i-- > 0;) {
			const Item = TC[i];
			if (Sync.PreventDuplicateTabs.Compare(Ctrl, Item)) {
				if (Ctrl.hwnd ? CanClose(Item) : !CanClose(Ctrl)) {
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
		}
		return hr;
	},

	Compare: item.getAttribute("Filter") ? function (Ctrl, Item) {
		return Ctrl.Id != Item.Id && api.ILIsEqual(Ctrl.FolderItem, Item.FolderItem) && Ctrl.FilterView == Item.FilterView
	} : function (Ctrl, Item) {
		return Ctrl.Id != Item.Id && api.ILIsEqual(Ctrl.FolderItem, Item.FolderItem)
	}
};

AddEvent("BeforeNavigate", Sync.PreventDuplicateTabs.Exec, true);

if (!HOME_PATH) {
	HOME_PATH = "about:blank";
}

delete item;
