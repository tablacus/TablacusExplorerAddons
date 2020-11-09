var Addon_Id = "darkmode";

Sync.DarkMode = {
	clrText: 0xffffff,
	clrBk: 0x202020,
	clrLine: 0x555555,
	css: api.UrlCreateFromPath(BuildPath(te.Data.Installed, "addons\\darkmode\\style.css")),


	Arrange: function (Ctrl) {
		var FV = GetFolderView(Ctrl);
		if (FV) {
			var hwnd = FV.hwndList;
			if (hwnd) {
				Sync.DarkMode.SetColor(FV, hwnd);
			}
		}
	},

	SetColor: function (FV, hwnd) {
		api.SendMessage(hwnd, LVM_SETTEXTCOLOR, 0, Sync.DarkMode.clrText);
		api.SendMessage(hwnd, LVM_SETBKCOLOR, 0, Sync.DarkMode.clrBk);
		api.SendMessage(hwnd, LVM_SETTEXTBKCOLOR, 0, Sync.DarkMode.clrBk);
		FV.ViewFlags |= 8;
		Sync.DarkMode.SetTV(FV.TreeView.hwndTree);
		if (FV.Type == CTRL_EB) {
			Sync.DarkMode.SetTV(FindChildByClass(FV.hwnd, WC_TREEVIEW));
		}
	},

	SetTV: function (hwnd) {
		if (hwnd) {
			api.SendMessage(hwnd, TVM_SETTEXTCOLOR, 0, Sync.DarkMode.clrText);
			api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, Sync.DarkMode.clrBk);
			api.SendMessage(hwnd, TVM_SETLINECOLOR, 0, Sync.DarkMode.clrLine);
		}
	},

	Init: function () {
		var cFV = te.Ctrls(CTRL_FV);
		for (var i in cFV) {
			this.Arrange(cFV[i]);
		}
	}
}

if (Sync.Color) {
	return;
}

AddEvent("ViewCreated", Sync.DarkMode.Arrange);

AddEvent("NavigateComplete", Sync.DarkMode.Arrange);

AddEvent("ChangeView", Sync.DarkMode.Arrange);

AddEvent("Create", function (Ctrl) {
	if (Ctrl.Type <= CTRL_EB) {
		Sync.DarkMode.Arrange(Ctrl);
		return;
	}
	if (Ctrl.Type == CTRL_TV) {
		Sync.DarkMode.SetTV(Ctrl.hwndTree, GetSysColor(COLOR_WINDOWTEXT), GetSysColor(COLOR_WINDOW));
	}
});

AddEventId("AddonDisabledEx", "darkmode", function () {
	SetSysColor(COLOR_WINDOWTEXT, void 0);
	SetSysColor(COLOR_WINDOW, void 0);
	SetSysColor(COLOR_BTNFACE, void 0);
	Sync.DarkMode.clrText = GetSysColor(COLOR_WINDOWTEXT);
	Sync.DarkMode.clrBk = GetSysColor(COLOR_WINDOW);
	Sync.DarkMode.clrLine = GetSysColor(COLOR_WINDOWTEXT);
	Sync.DarkMode.Init();
});
if (api.IsAppThemed() && WINVER > 0x603) {
	AddEvent("Load", function () {
		if (!Sync.ClassicStyle) {
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

SetSysColor(COLOR_WINDOWTEXT, Sync.DarkMode.clrText);
SetSysColor(COLOR_WINDOW, Sync.DarkMode.clrBk);
SetSysColor(COLOR_BTNFACE, 0x2c2c2c);
Sync.DarkMode.Init();
