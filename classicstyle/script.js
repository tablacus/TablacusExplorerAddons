if (window.Addon == 1) {
	Addons.ClassicStyle =
	{
		SetTheme: function (Ctrl)
		{
			api.SetWindowTheme(Ctrl.hwndList, null, null);
			if (Ctrl.Type == CTRL_EB) {
				var hwnd = FindChildByClass(Ctrl.hwnd, WC_TREEVIEW);
				api.SetWindowTheme(hwnd, null, null);
			}
		},
		
		SetThemeAll: function(s)
		{
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				var FV = cFV[i];
				if (FV.hwndList) {
					api.SetWindowTheme(FV.hwndList, s, null);
					if (FV.Type == CTRL_EB) {
						var hwnd = FindChildByClass(FV.hwnd, WC_TREEVIEW);
						api.SetWindowTheme(hwnd, s, null);
					}
					if (FV.TreeView) {
						api.SetWindowTheme(FV.TreeView.hwndTree, s, null);
					}
				}
			}
		}
	};

	AddEvent("ViewCreated", Addons.ClassicStyle.SetTheme);

	AddEvent("TreeViewCreated", function(Ctrl)
	{
		api.SetWindowTheme(Ctrl.hwndTree, null, null);
	});

	AddEventId("AddonDisabledEx", "classicstyle", function ()
	{
		Addons.ClassicStyle.SetThemeAll("explorer");
	});

	Addons.ClassicStyle.SetThemeAll(null);
}
