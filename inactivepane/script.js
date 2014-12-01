var Addon_Id = "inactivepane";

if (window.Addon == 1) {
	Addons.InactivePane =
	{
		tid: {},

		Arrange: function (Ctrl)
		{
			var FV = (Ctrl.Type == CTRL_TC) ? Ctrl.Selected : Ctrl;
			if (FV) {
				delete Addons.InactivePane.tid[FV.hwnd];
				var hwnd = FV.hwndList;
				if (hwnd) {
					if (Addons.InactivePane.IsActive(Ctrl)) {
						return Addons.InactivePane.Active(Ctrl);
					}
					Addons.InactivePane.SetBKColor(Ctrl, hwnd, Addons.InactivePane.Color);
					api.SendMessage(hwnd, LVM_SETSELECTEDCOLUMN, -1, 0);
					api.InvalidateRect(hwnd, null, true);
				}
			}
		},

		Arrange2: function (Ctrl)
		{
			if (Ctrl) {
				if (Ctrl.Type == CTRL_TE) {
					Ctrl = te.Ctrl(CTRL_FV);
					if (!Ctrl) {
						return;
					}
				}
				if (Ctrl.Type <= CTRL_EB) {
					Addons.InactivePane.Arrange(Ctrl);
					if (!Addons.InactivePane.tid[Ctrl.hwnd]) {
						Addons.InactivePane.tid[Ctrl.hwnd] = setTimeout(function ()
						{
							Addons.InactivePane.Arrange(Ctrl);
						}, 100);
					}
				}
			}
		},

		SetBKColor: function (FV, hwnd, color)
		{
			var proc = api.GetWindowLongPtr(hwnd, GWLP_WNDPROC);
			if (proc) {
				api.CallWindowProc(proc, hwnd, LVM_SETBKCOLOR, 0, color);
				api.CallWindowProc(proc, hwnd, LVM_SETTEXTBKCOLOR, 0, color);
			}
			var TV = FV.TreeView;
			hwnd = TV.hwndTree;
			if (hwnd) {
				api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, color);
			}
			if (FV.Type == CTRL_EB) {
				hwnd = FindChildByClass(FV.hwnd, WC_TREEVIEW);
				api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, color);
			}
		},

		Active: function (FV)
		{
			var hwnd = FV.hwndList;
			if (hwnd) {
				Addons.InactivePane.SetBKColor(FV, hwnd, GetSysColor(COLOR_WINDOW));
/*				if (FV.CurrentViewMode == FVM_DETAILS && api.SendMessage(hwnd, LVM_GETSELECTEDCOLUMN, 0, 0) < 0) {
					var hHeader = api.SendMessage(hwnd, LVM_GETHEADER, 0, 0);
					if (hHeader) {
						for (var i = api.SendMessage(hHeader, HDM_GETITEMCOUNT, 0, 0); i-- > 0;) {
							var hdi = api.Memory("HDITEM");
							hdi.mask = HDI_FORMAT;
							api.SendMessage(hHeader, HDM_GETITEM, i, hdi);
							if (hdi.fmt & (HDF_SORTUP | HDF_SORTDOWN)) {
								api.SendMessage(hwnd, LVM_SETSELECTEDCOLUMN, i, 0);
								break;
							}
						}
					}
				}*/
				api.InvalidateRect(hwnd, null, true);
			}
		},

		IsActive: function (Ctrl)
		{
			var TC = te.Ctrl(CTRL_TC);
			return Ctrl.Parent.Id == TC.Id;
		}
	}

	AddEvent("ChangeView", function (Ctrl)
	{
		var cTC = te.Ctrls(CTRL_TC);
		for (var i in cTC) {
			var TC = cTC[i];
			if (TC && TC.Visible) {
				var FV = TC.Selected;
				Addons.InactivePane.Arrange(FV);
				var hwnd = FV.hwndList;
				var lvbk = api.Memory("LVBKIMAGE");
				var pszImage = api.Memory("WCHAR", 1024);
				lvbk.pszImage = pszImage;
				lvbk.cchImageMax = pszImage.Size;
				lvbk.ulFlags = LVBKIF_SOURCE_URL;
				api.SendMessage(hwnd, LVM_GETBKIMAGE, 0, lvbk);
				if (pszImage[0]) {
					var lvbk = api.Memory("LVBKIMAGE");
					lvbk.ulFlags = LVBKIF_SOURCE_NONE ;
					api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk);
				}
				if (Addons.Stripes) {
					Addons.Stripes.Arrange(FV);
				}
			}
		}
	}, true);

	AddEvent("AddonDisabled", function(Id)
	{
		if (api.strcmpi(Id, "activepane") == 0) {
			AddEventEx(window, "beforeunload", function ()
			{
				var cTC = te.Ctrls(CTRL_TC);
				for (var i in cTC) {
					var TC = cTC[i];
					if (TC) {
						var FV = TC.Selected;
						Addons.InactivePane.Active(FV);
					}
				}
			});
		}
	});

	var color = GetAddonOption(Addon_Id, "Color");
	Addons.InactivePane.Color = (api.QuadPart(color) || color === 0) ? color : GetSysColor(COLOR_APPWORKSPACE);
	var cTC = te.Ctrls(CTRL_TC);
	for (var i in cTC) {
		var TC = cTC[i];
		if (TC) {
			var FV = TC.Selected;
			Addons.InactivePane.Arrange2(FV);
		}
	}
}
else {
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		var color = item.getAttribute("Color");
		if (!(api.QuadPart(color) || color === 0)) {
			item.setAttribute("Color", GetSysColor(COLOR_APPWORKSPACE));
		}
	}
}
