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
					var hwnd = GethwndFromPid(oExec.ProcessID);
					if (api.GetWindowLongPtr(hwnd, GWL_EXSTYLE) & 0x10) {
						api.PostMessage(hwnd, WM_DROPFILES, Selected.hDrop, 0);
					} else {
						alert("No drop");
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
