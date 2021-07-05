const Addon_Id = "tasktray";
const item = GetAddonElement(Addon_Id);

Sync.TaskTray = {
	WM: TWM_APP++,
	bTray: false,
	WM_TaskbarCreated: api.RegisterWindowMessage("TaskbarCreated"),
	MinimizeToTray: item.getAttribute("MinimizeToTray"),
	CloseToTray: item.getAttribute("CloseToTray"),
	AlwaysInTray: item.getAttribute("AlwaysInTray"),

	CreateIcon: function (f, bShow) {
		if (!bShow) {
			api.ShowWindow(te.hwnd, SW_HIDE);
		}
		if (f && Sync.TaskTray.bTray) {
			return;
		}
		Sync.TaskTray.bTray = true;
		const NotifyData = api.Memory("NOTIFYICONDATA");
		NotifyData.hWnd = te.hwnd;
		NotifyData.uFlags = NIF_MESSAGE | NIF_ICON | NIF_TIP;
		NotifyData.uCallbackMessage = Sync.TaskTray.WM;
		NotifyData.hIcon = api.SendMessage(te.hwnd, WM_GETICON, ICON_SMALL, 0) || api.GetClassLongPtr(te.hwnd, GCLP_HICONSM);
		NotifyData.szTip = TITLE;
		for (let nDog = 5; !api.Shell_NotifyIcon(NIM_ADD, NotifyData) && nDog--;) {
			api.Sleep(100);
		}
	},

	DeleteIcon: function () {
		if (Sync.TaskTray.bTray) {
			Sync.TaskTray.bTray = false;

			const NotifyData = api.Memory("NOTIFYICONDATA");
			NotifyData.hWnd = te.hwnd;
			for (let nDog = 5; !api.Shell_NotifyIcon(NIM_DELETE, NotifyData) && nDog--;) {
				api.Sleep(100);
			}
		}
	},

	Iconic: function () {
		if (api.IsIconic(te.hwnd)) {
			Sync.TaskTray.CreateIcon(true, false);
		}
	}
}

AddEvent("SystemMessage", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (Ctrl.Type == CTRL_TE) {
		if (msg == WM_SYSCOMMAND) {
			if (wParam >= 0xf000) {
				switch (wParam & 0xFFF0) {
					case SC_MINIMIZE:
						if (Sync.TaskTray.MinimizeToTray) {
							Sync.TaskTray.CreateIcon(true, false);
							return 1;
						}
						break;
					case SC_CLOSE:
						if (Sync.TaskTray.CloseToTray) {
							Sync.TaskTray.CreateIcon(true, false);
							return 1;
						}
						break;
				}
			}
		}
		else if (msg == WM_DESTROY) {
			Sync.TaskTray.DeleteIcon();
		}
	}
});

AddEvent("AppMessage", function (Ctrl, hwnd, msg, wParam, lParam) {
	switch (msg) {
		case Sync.TaskTray.WM:
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
					ExecMenu(te, "TaskTray", pt, 0);
					break;
				case WM_QUERYENDSESSION:
					return 1;
				default:
					if (lParam == Sync.TaskTray.WM_TaskbarCreated) {
						Sync.TaskTray.CreateIcon(false, true);
					}
					break;
			}
			return S_OK;
	}
});

AddEvent("Finalize", Sync.TaskTray.DeleteIcon);

AddEvent("TaskTray", function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, ++nPos, GetText('&Close Application'));
	ExtraMenuCommand[nPos] = function (Ctrl, pt) {
		api.PostMessage(te.hwnd, WM_CLOSE, 0, 0);
	};
	return nPos;
});

AddEvent("TaskTray", function (Ctrl, hMenu, nPos) {
	api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, ++nPos, GetText('&Restore'));
	ExtraMenuCommand[nPos] = RestoreFromTray;
	return nPos;
});

if (Sync.TaskTray.AlwaysInTray) {
	AddEvent("Layout", function () {
		Sync.TaskTray.CreateIcon(true, true);
	});
} else {
	AddEvent("RestoreFromTray", function () {
		Sync.TaskTray.DeleteIcon();
	});
	if (Sync.TaskTray.MinimizeToTray) {
		AddEvent("Resize", Sync.TaskTray.Iconic);
	}
	if (Sync.TaskTray.MinimizeToTray || Sync.TaskTray.CloseToTray) {
		AddEvent("Layout", Sync.TaskTray.Iconic);
	}
}
