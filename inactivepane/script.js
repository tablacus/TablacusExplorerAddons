var Addon_Id = "inactivepane";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Color")) {
		item.setAttribute("Color", GetWebColor(GetSysColor(COLOR_APPWORKSPACE)));
	}
}

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
			api.SendMessage(hwnd, LVM_SETBKCOLOR, 0, color);
			api.SendMessage(hwnd, LVM_SETTEXTBKCOLOR, 0, color);
			api.SendMessage(hwnd, LVM_SETSELECTEDCOLUMN, -1, 0);
			var TV = FV.TreeView;
			hwnd = TV.hwndTree;
			if (hwnd) {
				api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, color);
			}
			if (FV.Type == CTRL_EB) {
				hwnd = FindChildByClass(FV.hwnd, WC_TREEVIEW);
				if (hwnd) {
					api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, color);
				}
			}
		},

		Active: function (FV)
		{
			var hwnd = FV.hwndList;
			if (hwnd) {
				Addons.InactivePane.SetBKColor(FV, hwnd, GetSysColor(COLOR_WINDOW));
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
	});

	AddEvent("AddonDisabled", function(Id)
	{
		if (api.strcmpi(Id, "inactivepane") == 0) {
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

	if (item) {
		Addons.InactivePane.Color = GetWinColor(item.getAttribute("Color"));
	}
	var cTC = te.Ctrls(CTRL_TC);
	for (var i in cTC) {
		var TC = cTC[i];
		if (TC) {
			var FV = TC.Selected;
			Addons.InactivePane.Arrange2(FV);
		}
	}
}
