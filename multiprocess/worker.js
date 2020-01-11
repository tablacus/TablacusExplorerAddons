importScripts("..\\..\\script\\consts.js");

if (MainWindow.Exchange) {
	te.OnSystemMessage = function (Ctrl, hwnd, msg, wParam, lParam)
	{
		try {
			if (msg == WM_TIMER && wParam == 1) {
				var bClose = g_bClose;
				var hwnd1 = null;
				var pid = api.Memory("DWORD");
				api.GetWindowThreadProcessId(hwnd, pid);
				var pid0 = pid[0];
				while (hwnd1 = api.FindWindowEx(null, hwnd1, null, null)) {
					var strClass = api.GetClassName(hwnd1);
					if (hwnd1 != hwnd && api.IsWindowVisible(hwnd1) && strClass != "Internet Explorer_Hidden") {
						api.GetWindowThreadProcessId(hwnd1, pid);
						if (pid[0] == pid0) {
							if (strClass == "#32770") {
								if (!(api.GetWindowLongPtr(hwnd1, GWL_EXSTYLE) & 8)) {
									api.SetForegroundWindow(hwnd1);
									api.SetWindowPos(hwnd1, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
								}
							}
							bClose = false;
							break;
						}
						//Dialog(UAC)
						if (api.GetWindowLongPtr(hwnd1, GWL_EXSTYLE) & 8) {
							if (strClass == "#32770") {
								if (ex) {
									ex.time = new Date().getTime();
								}
								bClose = false;
								break;
							}
						}
					}
				}
				if (bClose) {
					var nThreads = api.GetThreadCount(pid0);
					if (nThreads <= ex.nThreads) {
						api.KillTimer(hwnd, wParam);
					}
					try {
						if (ex && ex.TimeOver && new Date().getTime() - ex.time > ex.Sec * 1000 + 500) {
							ex.TimeOver = 0;
							ex.Callback(true);
						}
					} catch (e) {}
					if (nThreads <= ex.nThreads) {
						api.PostMessage(hwnd, WM_CLOSE, 0, 0);
					}
				}
			}
		} catch (e) {
			api.PostMessage(hwnd, WM_CLOSE, 0, 0);
		}
		return 0;
	}
	var pid = api.Memory("DWORD");
	api.GetWindowThreadProcessId(te.hwnd, pid);
	pid0 = pid[0];
	api.GetWindowThreadProcessId(api.GetForegroundWindow(), pid);

	g_bClose = false;
	api.SetTimer(te.hwnd, 1, 1000, null);
	var ex = MainWindow.Exchange[arg[3]];
	if (ex) {
		delete MainWindow.Exchange[arg[3]];
		ex.time = new Date().getTime();
		ex.nThreads = api.GetThreadCount(pid0);
		switch (ex.Mode) {
			case 0:
				api.DropTarget(ex.Dest).Drop(ex.Items, ex.grfKeyState, ex.pt, ex.dwEffect);
				break;
			case 1:
				InvokeCommand(CommandID_DELETE, ex.Items);
				break;
			case 2:
				InvokeCommand(CommandID_PASTE, ex.Dest);
				break;
		}
	}
	g_bClose = true;
	return "wait";
}

function InvokeCommand(nCommand, Items)
{
	var ContextMenu = api.ContextMenu(Items);
	if (ContextMenu) {
		var hMenu = api.CreatePopupMenu();
		ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
		ContextMenu.InvokeCommand(0, te.hwnd, nCommand - 1, null, null, SW_SHOWNORMAL, null, null);
		api.DestroyMenu(hMenu);
	}
}
