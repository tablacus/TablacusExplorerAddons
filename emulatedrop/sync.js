Sync.EmulateDrop = {
	db: [],

	DoDrop: function () {
		const db = Sync.EmulateDrop.db;
		for (let i = db.length; i--;) {
			let hwnd = GethwndFromPid(db[i].Exec.ProcessID, 1);
			if (hwnd) {
				const rc = api.Memory("RECT");
				api.GetWindowRect(hwnd, rc);
				const pt = api.Memory("POINT"), pt1 = api.Memory("POINT");
				pt1.x = rc.left + 16;
				pt1.y = rc.top + 8;
				api.SetForegroundWindow(hwnd);
				if (hwnd != api.WindowFromPoint(pt1) || api.GetKeyState(VK_LBUTTON) < 0 || api.GetKeyState(VK_RBUTTON) < 0) {
					hwnd = 0;
				} else {
					api.GetCursorPos(pt);
					api.SetCursorPos(pt1.x, pt1.y);
					InvokeUI("Addons.EmulateDrop.MouseUp");
					api.SHDoDragDrop(null, db[i].Selected, te, DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK, db[i].Selected.pdwEffect);
					clearTimeout(Sync.EmulateDrop.tid);
					api.SetCursorPos(pt.x, pt.y);
				}
			}
			if (hwnd || --db[i].Retry < 0) {
				db.splice(i, 1);
				break;
			}
		}
		if (db.length) {
			setTimeout(Sync.EmulateDrop.DoDrop, 999);
		}
	}
};

AddType("Emulate drop", {
	Exec: function (Ctrl, s, type, hwnd, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const Selected = FV.SelectedItems();
		if (Selected && Selected.Count) {
			Sync.EmulateDrop.db.push({
				Exec: wsh.Exec(api.PathUnquoteSpaces(ExtractMacro(te, s))),
				Selected: Selected,
				Retry: 9
			});
			Sync.EmulateDrop.DoDrop();
		}
		return S_OK;
	},

	Ref: function (path) {
		return OpenDialog(path);
	}
});
