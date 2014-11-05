if (window.Addon == 1) {
	Addons.TaskTray =
	{
		WM: TWM_APP++,
		bTray: false,
		WM_TaskbarCreated: api.RegisterWindowMessage("TaskbarCreated"),

		CreateIcon: function (f, bShow)
		{
			if (!bShow) {
				api.ShowWindow(te.hwnd, SW_HIDE);
			}
			if (f && Addons.TaskTray.bTray) {
				return;
			}
			Addons.TaskTray.bTray = true;
			var NotifyData = api.Memory("NOTIFYICONDATA");
			NotifyData.cbSize = NotifyData.Size;
			NotifyData.hWnd = te.hwnd;
			NotifyData.uFlags = NIF_MESSAGE | NIF_ICON | NIF_TIP;
			NotifyData.uCallbackMessage = Addons.TaskTray.WM;
			NotifyData.hIcon = api.GetClassLongPtr(te.hwnd, GCLP_HICONSM);
			NotifyData.szTip = TITLE;
			for (var nDog = 5; !api.Shell_NotifyIcon(NIM_ADD, NotifyData) && nDog--;) {
				api.Sleep(100);
			}
			api.DestroyIcon(NotifyData.hIcon);
		},

		DeleteIcon: function ()
		{
			if (Addons.TaskTray.bTray) {
				Addons.TaskTray.bTray = false;

				var NotifyData = api.Memory("NOTIFYICONDATA");
				NotifyData.cbSize = NotifyData.Size;
				NotifyData.hWnd = te.hwnd;
				for (var nDog = 5; !api.Shell_NotifyIcon(NIM_DELETE, NotifyData) && nDog--;) {
					api.Sleep(100);
				}
			}
		}
	}

	AddEvent("SystemMessage", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Ctrl.Type == CTRL_TE) {
			if (msg == WM_SYSCOMMAND) {
				if (wParam >= 0xf000) {
					switch (wParam & 0xFFF0) {
						case SC_MINIMIZE:
							if (GetAddonOption("tasktray", "MinimizeToTray")) {
								Addons.TaskTray.CreateIcon(true, false);
								return 1;
							}
							break;
						case SC_CLOSE:
							if (GetAddonOption("tasktray", "CloseToTray")) {
								Addons.TaskTray.CreateIcon(true, false);
								return 1;
							}
							break;
					}
				}
			}
			else if (msg == WM_DESTROY) {
				Addons.TaskTray.DeleteIcon();
			}
		}
	});

	AddEvent("AppMessage", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		switch (msg) {
			case Addons.TaskTray.WM:
				switch (lParam) {
					case WM_LBUTTONUP:
					case NIN_SELECT:
						api.SetForegroundWindow(te.hwnd);
						api.PostMessage(te.hwnd, WM_NULL, 0, 0);
						RestoreFromTray();
						break;
					case WM_RBUTTONUP:
					case WM_CONTEXTMENU:
						pt = api.Memory("POINT");
						api.GetCursorPos(pt);
						api.SetForegroundWindow(te.hwnd);
						api.PostMessage(te.hwnd, WM_NULL, 0, 0);
						ExecMenu(external, "TaskTray", pt, 0);
						break;
					case WM_QUERYENDSESSION:
						return 1;
					default:
						if (lParam == Addons.TaskTray.WM_TaskbarCreated) {
							Addons.TaskTray.CreateIcon(false, true);
						}
						break;
				}
				return S_OK;
		}
	});

	AddEventEx(window, "beforeunload", Addons.TaskTray.DeleteIcon);

	AddEvent("TaskTray", function (Ctrl, hMenu, nPos)
	{
		api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, ++nPos, GetText('&Close Application'));
		ExtraMenuCommand[nPos] = function (Ctrl, pt) {
			api.PostMessage(te.hwnd, WM_CLOSE, 0, 0);
		};
		return nPos;
	});

	AddEvent("TaskTray", function (Ctrl, hMenu, nPos)
	{
		api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, ++nPos, GetText('&Restore'));
		ExtraMenuCommand[nPos] = RestoreFromTray;
		return nPos;
	});

	AddEvent("RestoreFromTray", function ()
	{
		if (!GetAddonOption("tasktray", "AlwaysInTray")) {
			Addons.TaskTray.DeleteIcon();
		}
	});

	if (GetAddonOption("tasktray", "AlwaysInTray")) {
		Addons.TaskTray.CreateIcon(true, true);
	}
}
