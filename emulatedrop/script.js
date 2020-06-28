if (window.Addon == 1) {
	Addons.EmulateDrop = {
		db: [],

		DoDrop: function () {
			var db = Addons.EmulateDrop.db;
			for (i = db.length; i--;) {
				var hwnd = GethwndFromPid(db[i].Exec.ProcessID, 1);
				if (hwnd) {
					var rc = api.Memory("RECT");
					api.GetWindowRect(hwnd, rc);
					var pt = api.Memory("POINT"), pt1 = api.Memory("POINT");
					pt1.x = rc.left + 16;
					pt1.y = rc.top + 8;
					api.SetForegroundWindow(hwnd);
					if (hwnd != api.WindowFromPoint(pt1) || api.GetKeyState(VK_LBUTTON) < 0 || api.GetKeyState(VK_RBUTTON) < 0) {
						hwnd = 0;
					} else {
						api.GetCursorPos(pt);
						api.SetCursorPos(pt1.x, pt1.y);
						var tid = setTimeout(function () {
							api.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
						}, 99);
						api.SHDoDragDrop(null, db[i].Selected, te, DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK, db[i].Selected.pdwEffect);
						clearTimeout(tid);
						api.SetCursorPos(pt.x, pt.y);
					}
				}
				if (hwnd || --db[i].Retry < 0) {
					db.splice(i, 1);
					break;
				}
			}
			if (db.length) {
				setTimeout(Addons.EmulateDrop.DoDrop, 999);
			}
		}
	};

	AddType("Emulate drop", {
		Exec: function (Ctrl, s, type, hwnd, pt) {
			var FV = GetFolderView(Ctrl, pt);
			var Selected = FV.SelectedItems();
			if (Selected && Selected.Count) {
				Addons.EmulateDrop.db.push({
					Exec: wsh.Exec(api.PathUnquoteSpaces(ExtractMacro(te, s))),
					Selected: Selected,
					Retry: 9
				});
				Addons.EmulateDrop.DoDrop();
			}
			return S_OK;
		},

		Ref: function (path) {
			return OpenDialog(path);
		}
	});
}
