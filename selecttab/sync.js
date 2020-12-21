if (window.Addon == 1) {
	AddType("Select tab", {
		Exec: function (Ctrl, s, type, hwnd, pt) {
			const FolderItem = api.ILCreateFromPath(s);
			const TC = te.Ctrl(CTRL_TC);
			for (let i in TC) {
				if (api.ILIsEqual(TC[i], FolderItem)) {
					TC.SelectedIndex = i;
					break;
				}
			}
		},

		Ref: function (s, pt) {
			const ar = [];
			const TC = te.Ctrl(CTRL_TC);
			for (let i in TC) {
				ar.push(api.GetDisplayNameOf(TC[i], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
			}
			return g_basic.Popup(ar, s, pt);
		}
	});
}
