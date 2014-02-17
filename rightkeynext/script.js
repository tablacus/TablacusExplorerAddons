if (window.Addon == 1) {
	Addons.RightKeyNext =
	{
		Move: function (Ctrl, nMove, dwFlags)
		{
			if (Ctrl.hwndList) {
				var nViewMode = Ctrl.CurrentViewMode;
				if (nViewMode <= FVM_SMALLICON || (nViewMode >= FVM_THUMBNAIL && nViewMode <= FVM_THUMBSTRIP)) {
					var nIndex = Ctrl.GetFocusedItem() + nMove;
					var Items = Ctrl.Items;
					if (nIndex >= 0 && nIndex < Items.Count) {
						if ((dwFlags & SVSI_SELECT) == 0 && api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, nIndex, LVIS_SELECTED)) {
							dwFlags |= SVSI_SELECT;
						}
						Ctrl.SelectItem(Items.Item(nIndex), dwFlags);
					}
					return S_OK;
				}
			}
			return S_FALSE;
		},
		
		SelectPrev: function (Ctrl)
		{
			return Addons.RightKeyNext.Move(Ctrl, -1, SVSI_KEYBOARDSELECT | SVSI_DESELECTOTHERS | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
		},

		SelectNext: function (Ctrl)
		{
			return Addons.RightKeyNext.Move(Ctrl, 1, SVSI_KEYBOARDSELECT | SVSI_DESELECTOTHERS | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
		},

		FocusPrev: function (Ctrl)
		{
			return Addons.RightKeyNext.Move(Ctrl, -1, SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
		},

		FocusNext: function (Ctrl)
		{
			return Addons.RightKeyNext.Move(Ctrl, 1, SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
		}
	};

	//Left
	SetKeyExec("List", "$14b", Addons.RightKeyNext.SelectPrev, "Func");
	//Right
	SetKeyExec("List", "$14d", Addons.RightKeyNext.SelectNext, "Func");
	//Ctrl+Left
	SetKeyExec("List", "$214b", Addons.RightKeyNext.FocusPrev, "Func");
	//Ctrl+Right
	SetKeyExec("List", "$214d", Addons.RightKeyNext.FocusNext, "Func");
}
