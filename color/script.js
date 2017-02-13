var Addon_Id = "color";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Default")) {
	item.setAttribute("Default", GetWebColor(GetSysColor(COLOR_WINDOWTEXT)));
}
if (!item.getAttribute("Background")) {
	item.setAttribute("Background", GetWebColor(GetSysColor(COLOR_WINDOW)));
}

if (window.Addon == 1) {
	Addons.Color =
	{
		Arrange: function (Ctrl)
		{
			var clrText = GetSysColor(COLOR_WINDOWTEXT);
			var clrBk = GetSysColor(COLOR_WINDOW);
			var FV = GetFolderView(Ctrl);
			if (FV) {
				var hwnd = FV.hwndList;
				if (hwnd) {
					Addons.Color.SetColor(FV, hwnd, clrText, clrBk);
				}
			}
		},

		SetColor: function (FV, hwnd, clrText, clrBk)
		{
			api.SendMessage(hwnd, LVM_SETTEXTCOLOR, 0, clrText);
			api.SendMessage(hwnd, LVM_SETBKCOLOR, 0, clrBk);
			api.SendMessage(hwnd, LVM_SETTEXTBKCOLOR, 0, clrBk);
			FV.ViewFlags |= 8;
			Addons.Color.SetTV(FV.TreeView.hwndTree, clrText, clrBk);
			if (FV.Type == CTRL_EB) {
				Addons.Color.SetTV(FindChildByClass(FV.hwnd, WC_TREEVIEW), clrText, clrBk);
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

	AddEvent("ViewCreated", Addons.Color.Arrange);

	AddEvent("NavigateComplete", Addons.Color.Arrange);

	AddEvent("ChangeView", Addons.Color.Arrange);

	AddEvent("Create", function (Ctrl)
	{
		if (Ctrl.Type <= CTRL_EB) {
			Addons.Color.Arrange(Ctrl);
			return;
		}
		if (Ctrl.Type == CTRL_TV) {
			Addons.Color.SetTV(Ctrl.hwndTree, GetSysColor(COLOR_WINDOWTEXT), GetSysColor(COLOR_WINDOW));
		}
	});

	AddEventId("AddonDisabledEx", "color", function ()
	{
		SetSysColor(COLOR_WINDOWTEXT, undefined);
		SetSysColor(COLOR_WINDOW, undefined);
		Addons.Color.Init();
	});

	if (item) {
		SetSysColor(COLOR_WINDOWTEXT, GetWinColor(item.getAttribute("Default")));
		SetSysColor(COLOR_WINDOW, GetWinColor(item.getAttribute("Background")));
		Addons.Color.Init();
	}
}
