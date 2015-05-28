importScripts("..\\..\\script\\consts.js");

if (MainWindow.Exchange) {
	var ex = MainWindow.Exchange[arg[3]];
	if (ex) {
		delete MainWindow.Exchange[arg[3]];
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

	te.OnSystemMessage = function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (msg == WM_TIMER && wParam == 1) {
			var bClose = true;
			var hwnd1 = null;
			var pid = api.Memory("DWORD");
			api.GetWindowThreadProcessId(hwnd, pid);
			var pid0 = pid[0];
			while (hwnd1 = api.FindWindowEx(null, hwnd1, null, null)) {
				if (hwnd1 != hwnd && api.IsWindowVisible(hwnd1) && api.GetClassName(hwnd1) != "Internet Explorer_Hidden") {
					api.GetWindowThreadProcessId(hwnd1, pid);
					if (pid[0] == pid0) {
						bClose = false;
						break;
					}
					//Dialog(UAC)
					if (api.GetWindowLongPtr(hwnd1, GWL_EXSTYLE) & 8) {
						if (api.GetClassName(hwnd1) == "#32770") {
							bClose = false;
							break;
						}
					}
				}
			}
			if (bClose) {
				api.KillTimer(hwnd, wParam);
				api.PostMessage(hwnd, WM_CLOSE, 0, 0);
			}
		}
		return 0; 
	}
	api.SetTimer(te.hwnd, 1, 5000, null);

	var pid = api.Memory("DWORD");
	api.GetWindowThreadProcessId(te.hwnd, pid);
	var pid0 = pid[0];
	api.GetWindowThreadProcessId(api.GetForegroundWindow(), pid);
	if (pid[0] == pid0) {
		api.SetForegroundWindow(ex.hwnd);
	}
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
