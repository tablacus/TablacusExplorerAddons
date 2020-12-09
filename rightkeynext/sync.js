Sync.RightKeyNext = {
	Move: function (Ctrl, nMove, dwFlags) {
		if (Ctrl.hwndList) {
			const nViewMode = Ctrl.CurrentViewMode;
			if (nViewMode <= FVM_SMALLICON || (nViewMode >= FVM_THUMBNAIL && nViewMode <= FVM_THUMBSTRIP)) {
				const nIndex = Ctrl.GetFocusedItem + nMove;
				const Items = Ctrl.Items;
				if (nIndex >= 0 && nIndex < Items.Count) {
					if ((dwFlags & SVSI_SELECT) == 0 && api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, nIndex, LVIS_SELECTED)) {
						dwFlags |= SVSI_SELECT;
					}
					Ctrl.SelectItem(nIndex, dwFlags);
				}
				return S_OK;
			}
		}
		return S_FALSE;
	},

	SelectPrev: function (Ctrl) {
		return Sync.RightKeyNext.Move(Ctrl, -1, SVSI_KEYBOARDSELECT | SVSI_DESELECTOTHERS | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	SelectNext: function (Ctrl) {
		return Sync.RightKeyNext.Move(Ctrl, 1, SVSI_KEYBOARDSELECT | SVSI_DESELECTOTHERS | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	AddPrev: function (Ctrl) {
		return Sync.RightKeyNext.Move(Ctrl, -1, SVSI_KEYBOARDSELECT | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	AddNext: function (Ctrl) {
		return Sync.RightKeyNext.Move(Ctrl, 1, SVSI_KEYBOARDSELECT | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	FocusPrev: function (Ctrl) {
		return Sync.RightKeyNext.Move(Ctrl, -1, SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	FocusNext: function (Ctrl) {
		return Sync.RightKeyNext.Move(Ctrl, 1, SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	}
};

//Left
SetKeyExec("List", "$14b", Sync.RightKeyNext.SelectPrev, "Func");
//Right
SetKeyExec("List", "$14d", Sync.RightKeyNext.SelectNext, "Func");
//Shift+Left
SetKeyExec("List", "$114b", Sync.RightKeyNext.AddPrev, "Func");
//Shift+Right
SetKeyExec("List", "$114d", Sync.RightKeyNext.AddNext, "Func");
//Ctrl+Left
SetKeyExec("List", "$214b", Sync.RightKeyNext.FocusPrev, "Func");
//Ctrl+Right
SetKeyExec("List", "$214d", Sync.RightKeyNext.FocusNext, "Func");
