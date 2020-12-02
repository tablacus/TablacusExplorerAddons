Sync.DropFiles = {
	db: [],

	DoDrop: function () {
		const db = Sync.DropFiles.db;
		for (let i = db.length; i--;) {
			const hwnd = GethwndFromPid(db[i].Exec.ProcessID, 1);
			if (hwnd) {
				api.PostMessage(hwnd, WM_DROPFILES, db[i].Selected.hDrop, 0);
			}
			if (hwnd || --db[i].Retry < 0) {
				db.splice(i, 1);
			}
		}
		if (db.length) {
			setTimeout(Sync.DropFiles.DoDrop, 999);
		}
	}
};

AddType("Drop files", {
	Exec: function (Ctrl, s, type, hwnd, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const Selected = FV.SelectedItems();
		if (Selected && Selected.Count) {
			Sync.DropFiles.db.push({
				Exec: wsh.Exec(api.PathUnquoteSpaces(ExtractMacro(te, s))),
				Selected: Selected,
				Retry: 9
			});
			Sync.DropFiles.DoDrop();
		}
		return S_OK;
	},

	Ref: function (path) {
		return OpenDialog(path);
	}
});
