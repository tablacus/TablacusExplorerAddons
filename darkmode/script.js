var Addon_Id = "darkmode";

if (window.Addon == 1) {
	Addons.DarkMode =
	{
		clrText: 0xffffff,
		clrBk: 0x202020,
		clrLine: 0x555555,

		Arrange: function (Ctrl)
		{
			var FV = GetFolderView(Ctrl);
			if (FV) {
				var hwnd = FV.hwndList;
				if (hwnd) {
					Addons.DarkMode.SetColor(FV, hwnd);
				}
			}
		},

		SetColor: function (FV, hwnd)
		{
			api.SendMessage(hwnd, LVM_SETTEXTCOLOR, 0, Addons.DarkMode.clrText);
			api.SendMessage(hwnd, LVM_SETBKCOLOR, 0, Addons.DarkMode.clrBk);
			api.SendMessage(hwnd, LVM_SETTEXTBKCOLOR, 0, Addons.DarkMode.clrBk);
			FV.ViewFlags |= 8;
			Addons.DarkMode.SetTV(FV.TreeView.hwndTree);
			if (FV.Type == CTRL_EB) {
				Addons.DarkMode.SetTV(FindChildByClass(FV.hwnd, WC_TREEVIEW));
			}
		},

		SetTV: function (hwnd)
		{
			if (hwnd) {
				api.SendMessage(hwnd, TVM_SETTEXTCOLOR, 0, Addons.DarkMode.clrText);
				api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, Addons.DarkMode.clrBk);
				api.SendMessage(hwnd, TVM_SETLINECOLOR, 0, Addons.DarkMode.clrLine);
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
		link.href = api.UrlCreateFromPath(fso.BuildPath(te.Data.Installed, "addons\\darkmode\\style.css"));
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
		SetSysColor(COLOR_WINDOWTEXT, void 0);
		SetSysColor(COLOR_WINDOW, void 0);
		SetSysColor(COLOR_BTNFACE, void 0);
		Addons.DarkMode.clrText = GetSysColor(COLOR_WINDOWTEXT);
		Addons.DarkMode.clrBk = GetSysColor(COLOR_WINDOW);
		Addons.DarkMode.clrLine = GetSysColor(COLOR_WINDOWTEXT);
		Addons.DarkMode.Init();
	});
	if (api.IsAppThemed() && WINVER > 0x603) {
		AddEvent("Load", function () {
			if (!Addons.ClassicStyle) {
				AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes) {
					if (pid) {
						var uState = api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, nmcd.dwItemSpec, LVIS_SELECTED);
						if (uState & LVIS_SELECTED || nmcd.uItemState & CDIS_HOT) {
							var rc = api.Memory("RECT");
							rc.left = LVIR_SELECTBOUNDS;
							api.SendMessage(Ctrl.hwndList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
							api.SetDCBrushColor(nmcd.hdc, 0x555555);
							api.FillRect(nmcd.hdc, rc, api.GetStockObject(DC_BRUSH));
						}
					}
				}, true);
			}
		});
	}

	SetSysColor(COLOR_WINDOWTEXT, Addons.DarkMode.clrText);
	SetSysColor(COLOR_WINDOW, Addons.DarkMode.clrBk);
	SetSysColor(COLOR_BTNFACE, 0x2c2c2c);
	Addons.DarkMode.Init();
}
