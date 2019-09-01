var Addon_Id = "darkmode";

if (window.Addon == 1) {
	Addons.DarkMode =
	{
		Arrange: function (Ctrl)
		{
			var clrText = GetSysColor(COLOR_WINDOWTEXT);
			var clrBk = GetSysColor(COLOR_WINDOW);
			var FV = GetFolderView(Ctrl);
			if (FV) {
				var hwnd = FV.hwndList;
				if (hwnd) {
					Addons.DarkMode.SetColor(FV, hwnd, clrText, clrBk);
				}
			}
		},

		SetColor: function (FV, hwnd, clrText, clrBk)
		{
			api.SendMessage(hwnd, LVM_SETTEXTCOLOR, 0, clrText);
			api.SendMessage(hwnd, LVM_SETBKCOLOR, 0, clrBk);
			api.SendMessage(hwnd, LVM_SETTEXTBKCOLOR, 0, clrBk);
			FV.ViewFlags |= 8;
			Addons.DarkMode.SetTV(FV.TreeView.hwndTree, clrText, clrBk);
			if (FV.Type == CTRL_EB) {
				Addons.DarkMode.SetTV(FindChildByClass(FV.hwnd, WC_TREEVIEW), clrText, clrBk);
			}
		},

		SetTV: function (hwnd, clrText, clrBk)
		{
			if (hwnd) {
				api.SendMessage(hwnd, TVM_SETTEXTCOLOR, 0, clrText);
				api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, clrBk);
				api.SendMessage(hwnd, TVM_SETLINECOLOR, 0, clrText);
			}
		},

		Init: function ()
		{
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				this.Arrange(cFV[i]);
			}
		}
	}

	AddEvent("BrowserCreated", function (doc)
	{
		var link = doc.createElement("link");
		link.rel = "stylesheet";
		link.type = "text/css";
		link.href = fso.BuildPath(te.Data.Installed, "addons\\darkmode\\style.css");
		doc.head.appendChild(link);
	}, true);

	if (Addons.Color) {
		return;
	}

	AddEvent("ViewCreated", Addons.DarkMode.Arrange);

	AddEvent("NavigateComplete", Addons.DarkMode.Arrange);

	AddEvent("ChangeView", Addons.DarkMode.Arrange);

	AddEvent("Create", function (Ctrl)
	{
		if (Ctrl.Type <= CTRL_EB) {
			Addons.DarkMode.Arrange(Ctrl);
			return;
		}
		if (Ctrl.Type == CTRL_TV) {
			Addons.DarkMode.SetTV(Ctrl.hwndTree, GetSysColor(COLOR_WINDOWTEXT), GetSysColor(COLOR_WINDOW));
		}
	});

	AddEventId("AddonDisabledEx", "darkmode", function ()
	{
		SetSysColor(COLOR_WINDOWTEXT, undefined);
		SetSysColor(COLOR_WINDOW, undefined);
		SetSysColor(COLOR_BTNFACE, undefined);
		Addons.DarkMode.Init();
	});

	SetSysColor(COLOR_WINDOWTEXT, 0xffffff);
	SetSysColor(COLOR_WINDOW, 0x202020);
	SetSysColor(COLOR_BTNFACE, 0x2c2c2c);
	Addons.DarkMode.Init();
}
