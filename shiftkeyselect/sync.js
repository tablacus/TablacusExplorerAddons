AddEvent("KeyMessage", function (Ctrl, hwnd, msg, key, keydata) {
	if (msg == WM_KEYDOWN && api.GetClassName(hwnd) == WC_LISTVIEW) {
		if (key == VK_SHIFT) {
			api.SendMessage(hwnd, 0x1043, 0, Ctrl.GetFocusedItem);
		} else if (api.GetKeyState(VK_SHIFT) < 0) {
			let nNext = -1;
			const nFocus = Ctrl.GetFocusedItem;
			const ViewMode = api.SendMessage(hwnd, LVM_GETVIEW, 0, 0);
			if (key == VK_UP) {
				if (Sync.DownKeyNext && (Ctrl.FolderFlags & 0x800) && !(ViewMode & 1)) {
					if (nFocus > 0) {
						nNext = nFocus - 1;
					}
				} else {
					nNext = api.SendMessage(hwnd, LVM_GETNEXTITEM, nFocus, LVNI_ABOVE);
				}
			} else if (key == VK_DOWN) {
				if (Sync.DownKeyNext && (Ctrl.FolderFlags & 0x800) && !(ViewMode & 1)) {
					if (nFocus < Ctrl.ItemCount(SVGIO_ALLVIEW) - 1) {
						nNext = nFocus + 1;
					}
				} else {
					nNext = api.SendMessage(hwnd, LVM_GETNEXTITEM, nFocus, LVNI_BELOW);
				}
			} else if (ViewMode != 1) {
				if (key == VK_LEFT) {
					if (Sync.RightKeyNext && !(Ctrl.FolderFlags & 0x800) && !(ViewMode & 1)) {
						if (nFocus > 0) {
							nNext = nFocus - 1;
						}
					} else {
						nNext = api.SendMessage(hwnd, LVM_GETNEXTITEM, nFocus, LVNI_TOLEFT);
					}
				} else if (key == VK_RIGHT) {
					if (Sync.RightKeyNext && !(Ctrl.FolderFlags & 0x800) && !(ViewMode & 1)) {
						if (nFocus < Ctrl.ItemCount(SVGIO_ALLVIEW) - 1) {
							nNext = nFocus + 1;
						}
					} else {
						nNext = api.SendMessage(hwnd, LVM_GETNEXTITEM, nFocus, LVNI_TORIGHT);
					}
				}
			}
			if (nNext >= 0) {
				Ctrl.SelectItem(nNext, SVSI_SELECT | SVSI_FOCUSED | SVSI_ENSUREVISIBLE);
				const lvi = api.Memory("LVITEM");
				lvi.stateMask = LVIS_SELECTED;
				const nSelection = Math.max(api.SendMessage(hwnd, 0x1042, 0, 0), 0);
				const nMin = Math.min(nSelection, nNext), nMax = Math.max(nSelection, nNext);
				for (let i = Math.min(nFocus, nMin); i <= Math.max(nFocus, nMax); ++i) {
					lvi.state = (i >= nMin && i <= nMax) ? LVIS_SELECTED : 0;
					api.SendMessage(hwnd, LVM_SETITEMSTATE, i, lvi);
				}
				return S_OK;
			}
		}
	}
}, true);

