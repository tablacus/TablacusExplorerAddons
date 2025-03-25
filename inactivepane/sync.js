const Addon_Id = "inactivepane";
const item = GetAddonElement(Addon_Id);

Sync.InactivePane = {
	TextColor: GetWinColor(item.getAttribute("TextColor") || "#444444"),
	Color: GetWinColor(item.getAttribute("Color") || "#aaaaaa"),
	DarkTextColor: GetWinColor(item.getAttribute("DarkTextColor") || "#aaaaaa"),
	DarkColor: GetWinColor(item.getAttribute("DarkColor") || "#444444"),

	Arrange: function (Ctrl, rc, Type, Id, FV) {
		if (Type == null) {
			FV = GetFolderView(Ctrl);
		}
		if (FV) {
			const hwnd = FV.hwndList;
			if (hwnd) {
				if (Sync.InactivePane.IsActive(FV)) {
					return Sync.InactivePane.Active(FV, hwnd);
				}
				const bDark = Sync.InactivePane.IsDark();
				Sync.InactivePane.SetBKColor(FV, hwnd, bDark ? Sync.InactivePane.DarkColor : Sync.InactivePane.Color, bDark ? Sync.InactivePane.DarkTextColor : Sync.InactivePane.TextColor);
				api.InvalidateRect(hwnd, null, true);
			}
		}
	},

	SetBKColor: function (FV, hwnd, color, text) {
		api.SendMessage(hwnd, LVM_SETTEXTCOLOR, 0, text);
		api.SendMessage(hwnd, LVM_SETBKCOLOR, 0, color);
		api.SendMessage(hwnd, LVM_SETTEXTBKCOLOR, 0, color);
		api.SendMessage(hwnd, LVM_SETSELECTEDCOLUMN, -1, 0);
		hwnd = FV.TreeView.hwndTree;
		if (hwnd) {
			api.SendMessage(hwnd, TVM_SETTEXTCOLOR, 0, text);
			api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, color);
		}
		if (FV.Type == CTRL_EB) {
			hwnd = FindChildByClass(FV.hwnd, WC_TREEVIEW);
			if (hwnd) {
				api.SendMessage(hwnd, TVM_SETTEXTCOLOR, 0, text);
				api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, color);
			}
		}
	},

	Active: function (FV, hwnd) {
		if (hwnd) {
			Sync.InactivePane.SetBKColor(FV, hwnd, GetSysColor(COLOR_WINDOW), GetSysColor(COLOR_WINDOWTEXT));
			api.InvalidateRect(hwnd, null, true);
		}
	},

	IsActive: function (Ctrl) {
		return Ctrl.Parent.Id == te.Ctrl(CTRL_TC).Id;
	},

	IsDark: function () {
		const cl = MainWindow.GetSysColor(COLOR_WINDOW);
		return (cl & 0xff) * 299 + (cl & 0xff00) * 2.29296875 + (cl & 0xff0000) * 0.001739501953125 < 127500;
	}
}

AddEvent("Arrange", Sync.InactivePane.Arrange);

AddEvent("VisibleChanged", function (Ctrl, Visible, Type, Id) {
	if (Visible && (Type || Ctrl.Type) == CTRL_TC) {
		Sync.InactivePane.Arrange(Ctrl, null, Type, Id, Ctrl.Selected);
	}
});

AddEventId("AddonDisabledEx", "inactivepane", function () {
	const cTC = te.Ctrls(CTRL_TC, false);
	for (let i = cTC.length; i-- > 0;) {
		const TC = cTC[i];
		if (TC) {
			Sync.InactivePane.Active(TC.Selected, TC.Selected.hwndList);
		}
	}
});

AddEvent("Load", function () {
	const cTC = te.Ctrls(CTRL_TC, true);
	for (let i = cTC.length; i-- > 0;) {
		const TC = cTC[i];
		if (TC) {
			Sync.InactivePane.Arrange(TC.Selected);
		}
	}
});
