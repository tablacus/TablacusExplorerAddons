var Addon_Id = "samelockedtab";
var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.SameLockedTab =
	{
		Close: api.LowPart(item.getAttribute("Close")),
		Multi: api.LowPart(item.getAttribute("Multi"))
	}

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
		if (GetLock(Ctrl)) {
			return;
		}
		var hr;
		var cTC = Addons.SameLockedTab.Multi ? te.Ctrls(CTRL_TC, true) : [Ctrl.Parent];
		var TC1 = Ctrl.Parent;
		for (var j = cTC.length; j--;) {
			var TC = cTC[j];
			for (var i = TC.Count; i-- > 0;) {
				var Item = TC[i];
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
					hr = Addons.SameLockedTab.Close ? E_ABORT : E_FAIL;
				}
			}
		}
		return hr;
	});
} else {
	SetTabContents(0, "", '<input type="checkbox" id="Close"><label for="Close">Close</label><br><input type="checkbox" id="Multi"><label for="Multi">Multiple panes</label>');
}
