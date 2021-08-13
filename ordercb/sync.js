Sync.OrderCB = {
	Exec: function (Verb, FV) {
		if (Verb == CommandID_CUT || Verb == CommandID_COPY) {
			if (FV.Type == CTRL_SB || FV.Type == CTRL_EB) {
				const Items = FV.Items(SVGIO_SELECTION | SVGIO_FLAG_VIEWORDER);
				if (Items.Count) {
					FV.SelectItem(Items.Item(0), SVSI_SELECT | SVSI_FOCUSED);
				}
			}
		}
	}
}

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	Sync.OrderCB.Exec((wParam & 0xfff) + 1, Ctrl);
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	Sync.OrderCB.Exec(Verb + 1, ContextMenu.FolderView);
}, true);
