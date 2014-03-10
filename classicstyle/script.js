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
					Addons.ClassicStyle.SetTheme(FV);
					if (FV.TreeView) {
						api.SetWindowTheme(FV.TreeView.hwndTree, s, null);
					}
				}
			}
		},

	};

	AddEvent("NavigateComplete", Addons.ClassicStyle.SetTheme);

	AddEvent("TreeViewCreated", function(Ctrl)
	{
		api.SetWindowTheme(Ctrl.hwndTree, null, null);
	});

	AddEvent("AddonDisabled", function(Id)
	{
		if (api.strcmpi(Id, "classicstyle") == 0) {
			AddEventEx(window, "beforeunload", function ()
			{
				Addons.ClassicStyle.SetThemeAll("explorer");
			});
		}
	});

	Addons.ClassicStyle.SetThemeAll(null);
}
