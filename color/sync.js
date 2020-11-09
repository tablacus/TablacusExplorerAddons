var Addon_Id = "color";

var item = GetAddonElement(Addon_Id);
Sync.Color = {
	clrText: GetWinColor(item.getAttribute("Default") || GetWebColor(GetSysColor(COLOR_WINDOWTEXT))),
	clrBk: GetWinColor(item.getAttribute("Background") || GetWebColor(GetSysColor(COLOR_WINDOW))),
	clrLine: GetWinColor(item.getAttribute("Lines") || 0x777777),

	Arrange: function (Ctrl)
	{
		var FV = GetFolderView(Ctrl);
		if (FV) {
			var hwnd = FV.hwndList;
			if (hwnd) {
				Sync.Color.SetColor(FV, hwnd);
			}
		}
	},

	SetColor: function (FV, hwnd)
	{
		api.SendMessage(hwnd, LVM_SETTEXTCOLOR, 0, Sync.Color.clrText);
		api.SendMessage(hwnd, LVM_SETBKCOLOR, 0, Sync.Color.clrBk);
		api.SendMessage(hwnd, LVM_SETTEXTBKCOLOR, 0, Sync.Color.clrBk);
		FV.ViewFlags |= 8;
		Sync.Color.SetTV(FV.TreeView.hwndTree);
		if (FV.Type == CTRL_EB) {
			Sync.Color.SetTV(FindChildByClass(FV.hwnd, WC_TREEVIEW));
		}
	},

	SetTV: function (hwnd)
	{
		if (hwnd) {
			api.SendMessage(hwnd, TVM_SETTEXTCOLOR, 0, Sync.Color.clrText);
			api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, Sync.Color.clrBk);
			api.SendMessage(hwnd, TVM_SETLINECOLOR, 0, Sync.Color.clrLine);
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

AddEvent("ViewCreated", Sync.Color.Arrange);

AddEvent("NavigateComplete", Sync.Color.Arrange);

AddEvent("ChangeView", Sync.Color.Arrange);

AddEvent("Create", function (Ctrl)
{
	if (Ctrl.Type <= CTRL_EB) {
		Sync.Color.Arrange(Ctrl);
		return;
	}
	if (Ctrl.Type == CTRL_TV) {
		Sync.Color.SetTV(Ctrl.hwndTree, GetSysColor(COLOR_WINDOWTEXT), GetSysColor(COLOR_WINDOW));
	}
});

AddEventId("AddonDisabledEx", "color", function ()
{
	SetSysColor(COLOR_WINDOWTEXT, void 0);
	SetSysColor(COLOR_WINDOW, void 0);
	Sync.Color.clrText = GetSysColor(COLOR_WINDOWTEXT);
	Sync.Color.clrBk = GetSysColor(COLOR_WINDOW);
	Sync.Color.clrLine = GetSysColor(COLOR_WINDOWTEXT);
	Sync.Color.Init();
});

SetSysColor(COLOR_WINDOWTEXT, Sync.Color.clrText);
SetSysColor(COLOR_WINDOW, Sync.Color.clrBk);

var clSelected = item.getAttribute("Selected");

if (clSelected) {
	AddEvent("Load", function () {
		Sync.Color.clSelected = GetWinColor(clSelected);
		AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes) {
			if (Ctrl.Type == CTRL_SB) {
				if (pid) {
					var uState = api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, nmcd.dwItemSpec, LVIS_SELECTED);
					if (uState & LVIS_SELECTED || nmcd.uItemState & CDIS_HOT) {
						var rc = api.Memory("RECT");
						rc.left = LVIR_SELECTBOUNDS;
						api.SendMessage(Ctrl.hwndList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
						rc.right -= 2;
						api.SetDCBrushColor(nmcd.hdc, Sync.Color.clSelected);
						api.FillRect(nmcd.hdc, rc, api.GetStockObject(DC_BRUSH));
					}
				}
			} else if (Ctrl.Type == CTRL_TV) {
				if (nmcd.uItemState & CDIS_SELECTED) {
					var cl = Sync.Color.clSelected;
					vcd.clrTextBk = cl;
					api.SetDCBrushColor(nmcd.hdc, cl);
					api.FillRect(nmcd.hdc, nmcd.rc, api.GetStockObject(DC_BRUSH));
					if (vcd.clrText == GetSysColor(COLOR_WINDOWTEXT)) {
						cl = (cl & 0xff) * 299 + (cl & 0xff00) * 2.29296875 + (cl & 0xff0000) * 0.001739501953125;
						vcd.clrText = cl > 127500 ? 0 : 0xffffff;
					}
				}
			}
		}, true);
	});
}
Sync.Color.Init();
