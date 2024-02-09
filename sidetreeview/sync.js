Sync.SideTreeView = {
	Expand: function (Depth, Collapse) {
		const FV = GetFolderView();
		if (FV) {
			const FolderItem = FV.FolderItem;
			if (FolderItem) {
				const TV = Common.SideTreeView.TV;
				if (TV && TV.Visible) {
					if (Collapse) {
						const hwnd = TV.hwndTree;
						let hItem = api.SendMessage(hwnd, TVM_GETNEXTITEM, 9, null);
						let Now = TV.SelectedItem;
						let New = FolderItem;
						let nUp = Depth ? 0 : 1;
						while (api.ILGetCount(New) > api.ILGetCount(Now)) {
							New = api.ILRemoveLastID(New);
						}
						while (api.ILGetCount(Now) > api.ILGetCount(New)) {
							Now = api.ILRemoveLastID(Now);
							++nUp;
						}
						while (!api.ILIsEqual(Now, New) && api.ILGetCount(Now) > 1) {
							New = api.ILRemoveLastID(New);
							Now = api.ILRemoveLastID(Now);
							++nUp;
						}
						while (--nUp > 0) {
							hItem = api.SendMessage(hwnd, TVM_GETNEXTITEM, 3, hItem);
						}
						do {
							api.PostMessage(hwnd, TVM_EXPAND, 0x8001, hItem);
						} while (hItem = api.SendMessage(hwnd, TVM_GETNEXTITEM, 1, hItem));
					}
					TV.Expand(FolderItem, Depth);
				}
			}
		}
	}
}

AddEvent("ChangeNotify", function (Ctrl, pidls, wParam, lParam) {
	Common.SideTreeView.TV.Notify(pidls.lEvent, pidls[0], pidls[1], wParam, lParam);
});
