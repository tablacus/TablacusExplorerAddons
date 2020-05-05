var Addon_Id = "inactivepane";
var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.InactivePane =
	{
		tid: {},

		Arrange: function (Ctrl) {
			var FV = (Ctrl.Type == CTRL_TC) ? Ctrl.Selected : Ctrl;
			if (FV) {
				delete Addons.InactivePane.tid[FV.hwnd];
				var hwnd = FV.hwndList;
				if (hwnd) {
					if (Addons.InactivePane.IsActive(Ctrl)) {
						return Addons.InactivePane.Active(Ctrl);
					}
					Addons.InactivePane.SetBKColor(Ctrl, hwnd, Addons.InactivePane.Color, Addons.InactivePane.TextColor);
					api.InvalidateRect(hwnd, null, true);
				}
			}
		},

		Arrange2: function (Ctrl) {
			if (Ctrl) {
				if (Ctrl.Type == CTRL_TE) {
					Ctrl = te.Ctrl(CTRL_FV);
				}
				if ((Ctrl || {}).Type == CTRL_SB) {
					Addons.InactivePane.Arrange(Ctrl);
					if (!Addons.InactivePane.tid[Ctrl.hwnd]) {
						Addons.InactivePane.tid[Ctrl.hwnd] = setTimeout(function () {
							Addons.InactivePane.Arrange(Ctrl);
						}, 500);
					}
				}
			}
		},

		SetBKColor: function (FV, hwnd, color, text) {
			api.SendMessage(hwnd, LVM_SETTEXTCOLOR, 0, text);
			api.SendMessage(hwnd, LVM_SETBKCOLOR, 0, color);
			api.SendMessage(hwnd, LVM_SETTEXTBKCOLOR, 0, color);
			api.SendMessage(hwnd, LVM_SETSELECTEDCOLUMN, -1, 0);
			var TV = FV.TreeView;
			hwnd = TV.hwndTree;
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

		Active: function (FV) {
			var hwnd = FV.hwndList;
			if (hwnd) {
				Addons.InactivePane.SetBKColor(FV, hwnd, GetSysColor(COLOR_WINDOW), GetSysColor(COLOR_WINDOWTEXT));
				api.InvalidateRect(hwnd, null, true);
			}
		},

		IsActive: function (Ctrl) {
			return Ctrl.Parent.Id == te.Ctrl(CTRL_TC).Id;
		},

		OnChange: function (Ctrl) {
			var cTC = te.Ctrls(CTRL_TC);
			for (var i in cTC) {
				var TC = cTC[i];
				if (TC && TC.Visible) {
					Addons.InactivePane.Arrange(TC.Selected);
				}
			}
		}
	}

	AddEvent("ChangeView", Addons.InactivePane.OnChange);
	AddEvent("VisibleChanged", function () {
		setTimeout(function () {
			Addons.InactivePane.OnChange();
		}, 99);
	});

	AddEventId("AddonDisabledEx", "inactivepane", function () {
		var cTC = te.Ctrls(CTRL_TC);
		for (var i in cTC) {
			var TC = cTC[i];
			if (TC) {
				Addons.InactivePane.Active(TC.Selected);
			}
		}
	});
	var cl = item.getAttribute("TextColor");
	Addons.InactivePane.TextColor = GetWinColor(cl || "#444444");
	cl = item.getAttribute("Color");
	Addons.InactivePane.Color = cl ? GetWinColor(cl) : GetSysColor(COLOR_APPWORKSPACE);

	var cTC = te.Ctrls(CTRL_TC);
	for (var i in cTC) {
		var TC = cTC[i];
		if (TC) {
			Addons.InactivePane.Arrange2(TC.Selected);
		}
	}
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
		document.getElementById("Color").setAttribute("placeholder", GetWebColor(GetSysColor(COLOR_APPWORKSPACE)));
	}
}
