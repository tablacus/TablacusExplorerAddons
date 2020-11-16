AddEvent("AppMessage", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (msg == Common.SideTreeView.WM) {
		var pidls = {};
		var hLock = api.SHChangeNotification_Lock(wParam, lParam, pidls);
		if (hLock) {
			api.SHChangeNotification_Unlock(hLock);
			Common.SideTreeView.TV.Notify(pidls.lEvent, pidls[0], pidls[1], wParam, lParam);
		}
		return S_OK;
	}
});

AddEvent("Finalize", function () {
	api.SHChangeNotifyDeregister(Common.SideTreeView.uRegisterId);
});

Common.SideTreeView.WM = TWM_APP++;
Common.SideTreeView.uRegisterId = api.SHChangeNotifyRegister(te.hwnd, SHCNRF_InterruptLevel | SHCNRF_NewDelivery, SHCNE_MKDIR | SHCNE_MEDIAINSERTED | SHCNE_DRIVEADD | SHCNE_NETSHARE | SHCNE_DRIVEREMOVED | SHCNE_MEDIAREMOVED | SHCNE_NETUNSHARE | SHCNE_RENAMEFOLDER | SHCNE_RMDIR | SHCNE_SERVERDISCONNECT | SHCNE_UPDATEDIR, Common.SideTreeView.WM, ssfDESKTOP, true);
