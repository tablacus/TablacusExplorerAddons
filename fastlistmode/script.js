if (window.Addon == 1) {
	Addons.FastListMode =
	{
		Exec: function (Ctrl) {
			var hList = Ctrl.hwndList;
			if (hList) {
				var dwStyle = api.GetWindowLongPtr(hList, GWL_STYLE);
				if (Ctrl.CurrentViewMode == FVM_LIST) {
					if (!(dwStyle & 0x800)) {
						api.SetWindowLongPtr(hList, GWL_STYLE, dwStyle ^ 0x800);
					}
					api.SendMessage(Ctrl.hwndList, LVM_SETVIEW, 2, 0);
					if (Ctrl.GroupBy) {
						Ctrl.GroupBy = "System.Null";
					}
				} else if (dwStyle & 0x800) {
					api.SetWindowLongPtr(hList, GWL_STYLE, dwStyle ^ 0x800);
					var nView = api.SendMessage(Ctrl.hwndList, LVM_GETVIEW, 0, 0);
					api.SendMessage(Ctrl.hwndList, LVM_SETVIEW, 1, 0);
					api.SendMessage(Ctrl.hwndList, LVM_SETVIEW, nView, 0);
				}
			}
		},

		Move: function (Ctrl, nMove, dwFlags) {
			if (Ctrl.hwndList) {
				var nViewMode = Ctrl.CurrentViewMode;
				if (nViewMode == FVM_LIST) {
					var nCurrent = Ctrl.GetFocusedItem;
					var nIndex = nCurrent + nMove;
					var Items = Ctrl.Items;
					if (nIndex >= 0 && nIndex < Items.Count) {
						var rc1 = api.Memory("RECT");
						var rc2 = api.Memory("RECT");
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
			return Addons.FastListMode.Move(Ctrl, -1, SVSI_KEYBOARDSELECT | SVSI_DESELECTOTHERS | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
		},

		SelectNext: function (Ctrl) {
			return Addons.FastListMode.Move(Ctrl, 1, SVSI_KEYBOARDSELECT | SVSI_DESELECTOTHERS | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
		},

		AddPrev: function (Ctrl) {
			return Addons.FastListMode.Move(Ctrl, -1, SVSI_KEYBOARDSELECT | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
		},

		AddNext: function (Ctrl) {
			return Addons.FastListMode.Move(Ctrl, 1, SVSI_KEYBOARDSELECT | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
		},

		FocusPrev: function (Ctrl) {
			return Addons.FastListMode.Move(Ctrl, -1, SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
		},

		FocusNext: function (Ctrl) {
			return Addons.FastListMode.Move(Ctrl, 1, SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
		}
	}

	AddEvent("ViewModeChanged", Addons.FastListMode.Exec);
	AddEvent("ChangeView", Addons.FastListMode.Exec);

	AddEventId("AddonDisabledEx", "fastlistmode", function () {
		var cFV = te.Ctrls(CTRL_FV);
		for (var i in cFV) {
			var hList = cFV[i].hwndList;
			if (hList) {
				var dwStyle = api.GetWindowLongPtr(hList, GWL_STYLE);
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
	SetKeyExec("List", "$148", Addons.FastListMode.SelectPrev, "Func");
	//Down
	SetKeyExec("List", "$150", Addons.FastListMode.SelectNext, "Func");
	//Shift+Up
	SetKeyExec("List", "$1148", Addons.FastListMode.AddPrev, "Func");
	//Shift+Down
	SetKeyExec("List", "$1150", Addons.FastListMode.AddNext, "Func");
	//Ctrl+Up
	SetKeyExec("List", "$2148", Addons.FastListMode.FocusPrev, "Func");
	//Ctrl+Down
	SetKeyExec("List", "$2150", Addons.FastListMode.FocusNext, "Func");

	var cFV = te.Ctrls(CTRL_FV);
	for (var i in cFV) {
		Addons.FastListMode.Exec(cFV[i]);
	}
}
