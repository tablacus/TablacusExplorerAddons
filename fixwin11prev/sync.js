AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
	if (Ctrl.Type == CTRL_SB) {
		if (msg == WM_LBUTTONDOWN || msg == WM_RBUTTONDOWN) {
			const hList = Ctrl.hwndList;
			let iItem = Ctrl.HitTest(pt, LVHT_ONITEM);
			if (iItem >= 0) {
				const rc = api.Memory("RECT");
				rc.left = LVIR_SELECTBOUNDS;
				api.SendMessage(hList, LVM_GETITEMRECT, iItem, rc);
				const ptc = pt.Clone();
				api.ScreenToClient(hList, ptc);
				if (!PtInRect(rc, ptc)) {
					for (iItem = Ctrl.ItemCount(SVGIO_ALLVIEW); --iItem >= 0;) {
						rc.left = LVIR_SELECTBOUNDS;
						api.SendMessage(hList, LVM_GETITEMRECT, iItem, rc);
						if (PtInRect(rc, ptc)) {
							if (api.GetKeyState(VK_SHIFT) < 0) {
								Ctrl.SelectItem(iItem, SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS | SVSI_SELECT);
								let i = api.SendMessage(hList, 4162, 0, 0), j = iItem;
								if (i > j) {
									j = i;
									i = iItem;
								}
								while (i < j) {
									Ctrl.SelectItem(i++, SVSI_SELECT);
								}
							} else {
								let wFlags = SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_SELECTIONMARK;
								if (api.GetKeyState(VK_CONTROL) < 0) {
									if (api.SendMessage(hList, LVM_GETNEXTITEM, iItem - 1, LVNI_ALL | LVNI_SELECTED) != iItem) {
										wFlags |= SVSI_SELECT;
									}
								} else {
									wFlags |= SVSI_DESELECTOTHERS | SVSI_SELECT;
								}
								Ctrl.SelectItem(iItem, wFlags);
							}
							return S_OK;
						}
					}
				}
			}
		}
	}
});
