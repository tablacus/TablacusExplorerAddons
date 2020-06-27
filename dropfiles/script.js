if (window.Addon == 1) {
	AddType("Drop files",
	{
		Exec: function (Ctrl, s, type, hwnd, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			var Selected = FV.SelectedItems();
			if (Selected && Selected.Count) {
				try {
					var path = api.PathUnquoteSpaces(ExtractMacro(te, s));
					var oExec = wsh.Exec(path);
					var hwnd = GethwndFromPid(oExec.ProcessID, 1);
					if (hwnd) {
						api.PostMessage(hwnd, WM_DROPFILES, Selected.hDrop, 0);
					} else {
						MessageBox("Can't drop.", TITLE, MB_ICONSTOP | MB_OK);
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
