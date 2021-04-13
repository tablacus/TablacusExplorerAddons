Sync.RightKeyNext = {
	Move: function (Ctrl, nMove, dwFlags) {
		const hList = Ctrl.hwndList;
		if (hList) {
			if (!(api.SendMessage(hList, LVM_GETVIEW, 0, 0) & 1)) {
				const nIndex = Ctrl.GetFocusedItem + nMove;
				if (nIndex >= 0 && nIndex < Ctrl.ItemCount(SVGIO_ALLVIEW)) {
					if ((dwFlags & SVSI_SELECT) == 0 && api.SendMessage(hList, LVM_GETITEMSTATE, nIndex, LVIS_SELECTED)) {
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
