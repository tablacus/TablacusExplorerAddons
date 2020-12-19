if (window.Addon == 1) {
	Addons.FullRowSelectEx = {
		hwnd: -1,
		tid: null,

		Exec: async function (Ctrl) {
			const hView = Ctrl && await Ctrl.hwndView;
			if (hView != this.hwnd) {
				let hList = await api.FindWindowEx(this.hwnd, 0, WC_LISTVIEW, null);
				if (hList) {
					api.PostMessage(hList, LVM_SETEXTENDEDLISTVIEWSTYLE, 0, await api.SendMessage(hList, LVM_GETEXTENDEDLISTVIEWSTYLE, 0, 0) | LVS_EX_FULLROWSELECT);
					Addons.FullRowSelectEx.hwnd = -1;
					clearTimeout(this.tid);
					this.tid = null;
				}
				if (hView) {
					hList = await api.FindWindowEx(hView, 0, WC_LISTVIEW, null);
					if (hList) {
						api.PostMessage(hList, LVM_SETEXTENDEDLISTVIEWSTYLE, 0, await api.SendMessage(hList, LVM_GETEXTENDEDLISTVIEWSTYLE, 0, 0) & (~LVS_EX_FULLROWSELECT));
						this.hwnd = hView;
						this.tid = setTimeout(this.Timeout, 999);
					}
				}
			}
		},

		Timeout: async function () {
			const pt = await api.Memory("POINT");
			await api.GetCursorPos(pt);
			const Ctrl = await te.CtrlFromPoint(pt);
			if ((Ctrl && await Ctrl.hwndView) != Addons.FullRowSelectEx.hwnd) {
				Addons.FullRowSelectEx.Exec(Ctrl);
			} else {
				Addons.FullRowSelectEx.tid = setTimeout(Addons.FullRowSelectEx.Timeout, 999);
			}
		}
	}
	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo) {
		Addons.FullRowSelectEx.Exec(Ctrl);
	});

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
		Addons.FullRowSelectEx.Exec(Ctrl);
	});
}
