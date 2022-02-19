Sync.FastListMode = {
	Exec: function (Ctrl) {
		const hList = Ctrl.hwndList;
		if (hList) {
			const dwStyle = api.GetWindowLongPtr(hList, GWL_STYLE);
			if (Ctrl.CurrentViewMode == FVM_LIST) {
				if (!(dwStyle & 0x800)) {
					if (!(Ctrl.FolderFlags & FWF_ALIGNLEFT)) {
						api.SetWindowLongPtr(hList, GWL_STYLE, dwStyle | 0x800);
					}
				}
				api.SendMessage(Ctrl.hwndList, LVM_SETVIEW, 2, 0);
				if (Ctrl.GroupBy) {
					Ctrl.GroupBy = "System.Null";
				}
			} else if (dwStyle & 0x800) {
				if (!(Ctrl.FolderFlags & FWF_ALIGNLEFT)) {
					api.SetWindowLongPtr(hList, GWL_STYLE, dwStyle & ~0x800);
				}
				const nView = api.SendMessage(Ctrl.hwndList, LVM_GETVIEW, 0, 0);
				api.SendMessage(Ctrl.hwndList, LVM_SETVIEW, 1, 0);
				api.SendMessage(Ctrl.hwndList, LVM_SETVIEW, nView, 0);
			}
		}
	},

	Move: function (Ctrl, nMove, dwFlags) {
		if (Ctrl.hwndList) {
			if (Ctrl.CurrentViewMode == FVM_LIST) {
				const nCurrent = Ctrl.GetFocusedItem;
				const nIndex = nCurrent + nMove;
				const Items = Ctrl.Items;
				if (nIndex >= 0 && nIndex < Items.Count) {
					const rc1 = api.Memory("RECT");
					const rc2 = api.Memory("RECT");
					api.SendMessage(Ctrl.hwndList, LVM_GETITEMRECT, nCurrent, rc1);
					api.SendMessage(Ctrl.hwndList, LVM_GETITEMRECT, nIndex, rc2);
					if (rc1.Left == rc2.Left) {
						return S_FALSE;
					}
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
		return Sync.FastListMode.Move(Ctrl, -1, SVSI_KEYBOARDSELECT | SVSI_DESELECTOTHERS | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	SelectNext: function (Ctrl) {
		return Sync.FastListMode.Move(Ctrl, 1, SVSI_KEYBOARDSELECT | SVSI_DESELECTOTHERS | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	AddPrev: function (Ctrl) {
		return Sync.FastListMode.Move(Ctrl, -1, SVSI_KEYBOARDSELECT | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	AddNext: function (Ctrl) {
		return Sync.FastListMode.Move(Ctrl, 1, SVSI_KEYBOARDSELECT | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	FocusPrev: function (Ctrl) {
		return Sync.FastListMode.Move(Ctrl, -1, SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	},

	FocusNext: function (Ctrl) {
		return Sync.FastListMode.Move(Ctrl, 1, SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
	}
}

AddEvent("ViewModeChanged", Sync.FastListMode.Exec);
AddEvent("ChangeView", Sync.FastListMode.Exec);

AddEventId("AddonDisabledEx", "fastlistmode", function () {
	const cFV = te.Ctrls(CTRL_FV);
	for (let i in cFV) {
		let hList = cFV[i].hwndList;
		if (hList) {
			const dwStyle = api.GetWindowLongPtr(hList, GWL_STYLE);
			if (dwStyle & 0x800) {
				api.SetWindowLongPtr(hList, GWL_STYLE, dwStyle ^ 0x800);
				if (cFV[i].CurrentViewMode == FVM_LIST) {
					api.SendMessage(hList, LVM_SETVIEW, 3, 0);
				}
			}
		}
	}
});

//Up
SetKeyExec("List", "$148", Sync.FastListMode.SelectPrev, "Func");
//Down
SetKeyExec("List", "$150", Sync.FastListMode.SelectNext, "Func");
//Shift+Up
SetKeyExec("List", "$1148", Sync.FastListMode.AddPrev, "Func");
//Shift+Down
SetKeyExec("List", "$1150", Sync.FastListMode.AddNext, "Func");
//Ctrl+Up
SetKeyExec("List", "$2148", Sync.FastListMode.FocusPrev, "Func");
//Ctrl+Down
SetKeyExec("List", "$2150", Sync.FastListMode.FocusNext, "Func");

const cFV = te.Ctrls(CTRL_FV);
for (let i in cFV) {
	Sync.FastListMode.Exec(cFV[i]);
}
