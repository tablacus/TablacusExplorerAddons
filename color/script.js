var Addon_Id = "color";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Default")) {
		item.setAttribute("Default", GetWebColor(GetSysColor(COLOR_WINDOWTEXT)));
	}
	if (!item.getAttribute("Background")) {
		item.setAttribute("Background", GetWebColor(GetSysColor(COLOR_WINDOW)));
	}
}

if (window.Addon == 1) {
	Addons.Color =
	{
		tid: {},

		Arrange: function (Ctrl)
		{
			var FV = GetFolderView(Ctrl);
			if (FV) {
				delete Addons.Color.tid[FV.hwnd];
				var hwnd = FV.hwndList;
				if (hwnd) {
					Addons.Color.SetColor(FV, hwnd, GetSysColor(COLOR_WINDOWTEXT), GetSysColor(COLOR_WINDOW));
				}
			}
		},

		SetColor: function (FV, hwnd, clrText, clrBk)
		{
			api.SendMessage(hwnd, LVM_SETTEXTCOLOR, 0, clrText);
			api.SendMessage(hwnd, LVM_SETBKCOLOR, 0, clrBk);
			api.SendMessage(hwnd, LVM_SETTEXTBKCOLOR, 0, clrBk);
			FV.ViewFlags |= 8;
			var TV = FV.TreeView;
			hwnd = TV.hwndTree;
			if (hwnd) {
				api.SendMessage(hwnd, TVM_SETTEXTCOLOR, 0, clrText);
				api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, clrBk);
				api.SendMessage(hwnd, TVM_SETLINECOLOR, 0, clrText);
			}
			if (FV.Type == CTRL_EB) {
				hwnd = FindChildByClass(FV.hwnd, WC_TREEVIEW);
				if (hwnd) {
					api.SendMessage(hwnd, TVM_SETTEXTCOLOR, 0, clrText);
					api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, clrBk);
					api.SendMessage(hwnd, TVM_SETLINECOLOR, 0, clrText);
				}
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
	AddEvent("NavigateComplete", function (Ctrl)
	{
		if (Ctrl.Type == CTRL_EB) {
			Addons.Color.Arrange(Ctrl);
		}
	});

	AddEvent("Create", function (Ctrl)
	{
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_TV) {
			Addons.Color.Arrange(Ctrl);
		}
	});

	AddEvent("AddonDisabled", function(Id)
	{
		if (String(Id).toLowerCase() == "color") {
			AddEventEx(window, "beforeunload", function ()
			{
				SetSysColor(COLOR_WINDOWTEXT, undefined);
				SetSysColor(COLOR_WINDOW, undefined);
				Addons.Color.Init();
			});
		}
	});

	if (item) {
		SetSysColor(COLOR_WINDOWTEXT, GetWinColor(item.getAttribute("Default")));
		SetSysColor(COLOR_WINDOW, GetWinColor(item.getAttribute("Background")));
		Addons.Color.Init();
	}
}
