if (window.Addon == 1) {
	Addons.DropFiles = {
		db: [],

		DoDrop: function () {
			var db = Addons.DropFiles.db;
			for (i = db.length; i--;) {
				var hwnd = GethwndFromPid(db[i].Exec.ProcessID, 1);
				if (hwnd) {
					api.PostMessage(hwnd, WM_DROPFILES, db[i].Selected.hDrop, 0);
				}
				if (hwnd || --db[i].Retry < 0) {
					db.splice(i, 1);
				}
			}
			if (db.length) {
				setTimeout(Addons.DropFiles.DoDrop, 999);
			}
		}
	};

	AddType("Drop files", {
		Exec: function (Ctrl, s, type, hwnd, pt) {
			var FV = GetFolderView(Ctrl, pt);
			var Selected = FV.SelectedItems();
			if (Selected && Selected.Count) {
				Addons.DropFiles.db.push({
					Exec: wsh.Exec(api.PathUnquoteSpaces(ExtractMacro(te, s))),
					Selected: Selected,
					Retry: 9
				});
				Addons.DropFiles.DoDrop();
			}
			return S_OK;
		},

		Ref: function (path) {
			return OpenDialog(path);
		}
	});
}
