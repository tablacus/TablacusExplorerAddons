if (window.Addon == 1) {
	AddType("Emulate drop", {
		Exec: function (Ctrl, s, type, hwnd, pt) {
			var FV = GetFolderView(Ctrl, pt);
			var Selected = FV.SelectedItems();
			if (Selected && Selected.Count) {
				try {
					var path = api.PathUnquoteSpaces(ExtractMacro(te, s));
					var oExec = wsh.Exec(path);
					var hwnd = GethwndFromPid(oExec.ProcessID, 3);
					if (hwnd) {
						while (api.GetASyncKeyState(VK_LBUTTON) < 0 || api.GetASyncKeyState(VK_RBUTTON) < 0) {
							api.Sleep(999);
						}
						var rc = api.Memory("RECT");
						api.GetWindowRect(hwnd, rc);
						var pt = api.Memory("POINT"), pt1 = api.Memory("POINT");
						pt1.x = rc.left + 16;
						pt1.y = rc.top + 8;
						for (var nDog = 60; nDog-- && hwnd != api.WindowFromPoint(pt1);) {
							api.Sleep(999);
							api.SetForegroundWindow(hwnd);
						}
						if (nDog > 0) {
							api.GetCursorPos(pt);
							api.SetCursorPos(pt1.x, pt1.y);
							api.SHDoDragDrop(null, Selected, te, DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK, Selected.pdwEffect);
							api.SetCursorPos(pt.x, pt.y);
						}
					}
				} catch (e) {
					MessageBox([e.description || e.toString(), path].join("\n\n"), TITLE, MB_OK);
				}
			}
			return S_OK;
		},

		Ref: function (path) {
			return OpenDialog(path);
		}
	});
}
