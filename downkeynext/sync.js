Sync.DownKeyNext = {
	Move: function (Ctrl, nMove, dwFlags) {
		const hList = Ctrl.hwndList;
		if (hList && (Ctrl.FolderFlags & 0x800)) {
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
		return Sync.DownKeyNext.Move(Ctrl, -1, SVSI_KEYBOARDSELECT | SVSI_DESELECTOTHERS | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	SelectNext: function (Ctrl) {
		return Sync.DownKeyNext.Move(Ctrl, 1, SVSI_KEYBOARDSELECT | SVSI_DESELECTOTHERS | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	AddPrev: function (Ctrl) {
		return Sync.DownKeyNext.Move(Ctrl, -1, SVSI_KEYBOARDSELECT | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	AddNext: function (Ctrl) {
		return Sync.DownKeyNext.Move(Ctrl, 1, SVSI_KEYBOARDSELECT | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	FocusPrev: function (Ctrl) {
		return Sync.DownKeyNext.Move(Ctrl, -1, SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	FocusNext: function (Ctrl) {
		return Sync.DownKeyNext.Move(Ctrl, 1, SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	}
};

//Up
SetKeyExec("List", "$148", Sync.DownKeyNext.SelectPrev, "Func");
//Down
SetKeyExec("List", "$150", Sync.DownKeyNext.SelectNext, "Func");
//Shift+Up
SetKeyExec("List", "$1148", Sync.DownKeyNext.AddPrev, "Func");
//Shift+Down
SetKeyExec("List", "$1150", Sync.DownKeyNext.AddNext, "Func");
//Ctrl+Up
SetKeyExec("List", "$2148", Sync.DownKeyNext.FocusPrev, "Func");
//Ctrl+Down
SetKeyExec("List", "$2150", Sync.DownKeyNext.FocusNext, "Func");
