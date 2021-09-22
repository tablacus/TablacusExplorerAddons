AddEvent("KeyMessage", function (Ctrl, hwnd, msg, key, keydata) {
	if (Ctrl.Type == CTRL_SB && msg == WM_KEYDOWN) {
		const hList = Ctrl.hwndList;
		if (key == VK_SHIFT) {
			api.SendMessage(hList, 0x1043, 0, Ctrl.GetFocusedItem);
		} else if (api.GetKeyState(VK_SHIFT) < 0) {
			let nNext = -1;
			const nFocus = Ctrl.GetFocusedItem;
			if (key == VK_LEFT) {
				if (Sync.RightKeyNext && !(Ctrl.FolderFlags & 0x800) && !(api.SendMessage(hList, LVM_GETVIEW, 0, 0) & 1)) {
					if (nFocus > 0) {
						nNext = nFocus - 1;
					}
				} else {
					nNext = api.SendMessage(hList, LVM_GETNEXTITEM, nFocus, LVNI_TOLEFT);
				}
			} else if (key == VK_UP) {
				if (Sync.DownKeyNext && (Ctrl.FolderFlags & 0x800) && !(api.SendMessage(hList, LVM_GETVIEW, 0, 0) & 1)) {
					if (nFocus > 0) {
						nNext = nFocus - 1;
					}
				} else {
					nNext = api.SendMessage(hList, LVM_GETNEXTITEM, nFocus, LVNI_ABOVE);
				}
			} else if (key == VK_RIGHT) {
				if (Sync.RightKeyNext && !(Ctrl.FolderFlags & 0x800) && !(api.SendMessage(hList, LVM_GETVIEW, 0, 0) & 1)) {
					if (nFocus < Ctrl.ItemCount(SVGIO_ALLVIEW) - 1) {
						nNext = nFocus + 1;
					}
				} else {
					nNext = api.SendMessage(hList, LVM_GETNEXTITEM, nFocus, LVNI_TORIGHT);
				}
			} else if (key == VK_DOWN) {
				if (Sync.DownKeyNext && (Ctrl.FolderFlags & 0x800) && !(api.SendMessage(hList, LVM_GETVIEW, 0, 0) & 1)) {
					if (nFocus < Ctrl.ItemCount(SVGIO_ALLVIEW) - 1) {
						nNext = nFocus + 1;
					}
				} else {
					nNext = api.SendMessage(hList, LVM_GETNEXTITEM, nFocus, LVNI_BELOW);
				}
			}
			if (nNext >= 0) {
				Ctrl.SelectItem(nNext, SVSI_SELECT | SVSI_FOCUSED | SVSI_ENSUREVISIBLE);
				const lvi = api.Memory("LVITEM");
				lvi.stateMask = LVIS_SELECTED;
				const nSelection = Math.max(api.SendMessage(hList, 0x1042, 0, 0), 0);
				const nMin = Math.min(nSelection, nNext), nMax = Math.max(nSelection, nNext);
				for (let i = Math.min(nFocus, nMin); i <= Math.max(nFocus, nMax); ++i) {
					lvi.state = (i >= nMin && i <= nMax) ? LVIS_SELECTED : 0;
					api.SendMessage(hList, LVM_SETITEMSTATE, i, lvi);
				}
				return S_OK;
			}
		}
	}
}, true);

