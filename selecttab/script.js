if (window.Addon == 1) {
	AddType("Select tab",
	{
		Exec: function (Ctrl, s, type, hwnd, pt)
		{
			var FolderItem = api.ILCreateFromPath(s);
			var TC = te.Ctrl(CTRL_TC);
			for (var i in TC) {
				if (api.ILIsEqual(TC[i], FolderItem)) {
					TC.SelectedIndex = i;
					break;
				}
			}
		},

		Ref: function (s, pt)
		{
			var ar = [];
			var TC = te.Ctrl(CTRL_TC);
			for (var i in TC) {
				ar.push(api.GetDisplayNameOf(TC[i], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
			}
			return g_basic.Popup(ar, s, pt);
		}
	});
}
