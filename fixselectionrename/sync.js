if (window.Addon == 1) {
	AddEvent("BeginLabelEdit", function (Ctrl) {
		if (Ctrl.hwndList && Ctrl.FocusedItem && !IsFolderEx(Ctrl.FocusedItem)) {
			if (WINVER < 0x600 || api.ILIsEqual(Ctrl.FolderItem.Alt, ssfRESULTSFOLDER)) {
				const n = String(fso.GetFileName(api.GetDisplayNameOf(Ctrl.FocusedItem, SHGDN_FORPARSING | SHGDN_ORIGINAL))).lastIndexOf(".");
				const hwndEC = api.SendMessage(Ctrl.hwndList, LVM_GETEDITCONTROL, 0, 0);
				if (n >= 0 && hwndEC) {
					api.PostMessage(hwndEC, 0xB1, 0, n);
				}
			}
		}
	});
}
