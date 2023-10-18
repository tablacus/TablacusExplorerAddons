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

AddEvent("AppMessage", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (msg == Common.SideTreeView.WM) {
		var pidls = {};
		var hLock = api.SHChangeNotification_Lock(wParam, lParam, pidls);
		if (hLock) {
			api.SHChangeNotification_Unlock(hLock);
			if (pidls[0] && /^[A-Z]:\\|^\\\\\w/i.test(pidls[0].Path) && !IsCloud(pidls[0])) {
				Common.SideTreeView.TV.Notify(pidls.lEvent, pidls[0], pidls[1], wParam, lParam);
			}
		}
		return S_OK;
	}
});

AddEvent("Finalize", function () {
	api.SHChangeNotifyDeregister(Common.SideTreeView.uRegisterId);
});

Common.SideTreeView.WM = TWM_APP++;
Common.SideTreeView.uRegisterId = api.SHChangeNotifyRegister(te.hwnd, SHCNRF_InterruptLevel | SHCNRF_NewDelivery, SHCNE_MKDIR | SHCNE_MEDIAINSERTED | SHCNE_DRIVEADD | SHCNE_NETSHARE | SHCNE_DRIVEREMOVED | SHCNE_MEDIAREMOVED | SHCNE_NETUNSHARE | SHCNE_RENAMEFOLDER | SHCNE_RMDIR | SHCNE_SERVERDISCONNECT | SHCNE_UPDATEDIR, Common.SideTreeView.WM, ssfDESKTOP, true);
