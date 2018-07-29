var Addon_Id = "samelockedtab";
var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.SameLockedTab =
	{
		hr: api.LowPart(item.getAttribute("Close")) ? E_ABORT : E_FAIL
	}

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		var hr;
		var TC = Ctrl.Parent;
		for (var i = TC.Count; i-- > 0;) {
			var Item = TC.Item(i);
			if (Item.Data.Lock && Ctrl.hwnd != Item.hwnd && api.ILIsEqual(Ctrl.FolderItem, Item.FolderItem)) {
				if (!(wFlags & SBSP_ACTIVATE_NOFOCUS) || TC.Selected.hwnd == Ctrl.hwnd) {
					(function (TC, i, Item, Selected) { setTimeout(function () {
						TC.SelectedIndex = i;
						if (Selected.Count == 1) {
							Item.SelectItem(Selected.Item(0), SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_NOTAKEFOCUS | SVSI_DESELECTOTHERS | SVSI_SELECT);
						}
					}, 99);}) (TC, i, Item, Ctrl.SelectedItems());
				}
				hr = Addons.SameLockedTab.hr;
			}
		}
		return hr;
	});
} else {
	SetTabContents(0, "General", '<input type="checkbox" id="Close" /><label for="Close">Close</label>');
}
