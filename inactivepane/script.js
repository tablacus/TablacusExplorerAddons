const Addon_Id = "inactivepane";
const item = await GetAddonElement(Addon_Id);

Addons.InactivePane = {
	TextColor: item.getAttribute("TextColor"),
	Color: item.getAttribute("Color"),

	Arrange: async function (Ctrl) {
		const FV = await GetFolderView(Ctrl);
		if (FV) {
			var hwnd = await FV.hwndList;
			if (hwnd) {
				if (await Addons.InactivePane.IsActive(FV)) {
					return Addons.InactivePane.Active(FV, hwnd);
				}
				Addons.InactivePane.SetBKColor(FV, hwnd, Addons.InactivePane.Color, Addons.InactivePane.TextColor);
				api.InvalidateRect(hwnd, null, true);
			}
		}
	},

	SetBKColor: async function (FV, hwnd, color, text) {
		api.SendMessage(hwnd, LVM_SETTEXTCOLOR, 0, text);
		api.SendMessage(hwnd, LVM_SETBKCOLOR, 0, color);
		api.SendMessage(hwnd, LVM_SETTEXTBKCOLOR, 0, color);
		api.SendMessage(hwnd, LVM_SETSELECTEDCOLUMN, -1, 0);
		const TV = await FV.TreeView;
		hwnd = await TV.hwndTree;
		if (hwnd) {
			api.SendMessage(hwnd, TVM_SETTEXTCOLOR, 0, text);
			api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, color);
		}
		if (await FV.Type == CTRL_EB) {
			hwnd = await FindChildByClass(await FV.hwnd, WC_TREEVIEW);
			if (hwnd) {
				api.SendMessage(hwnd, TVM_SETTEXTCOLOR, 0, text);
				api.SendMessage(hwnd, TVM_SETBKCOLOR, 0, color);
			}
		}
	},

	Active: async function (FV, hwnd) {
		if (hwnd) {
			Addons.InactivePane.SetBKColor(FV, hwnd, await GetSysColor(COLOR_WINDOW), await GetSysColor(COLOR_WINDOWTEXT));
			api.InvalidateRect(hwnd, null, true);
		}
	},

	IsActive: async function (Ctrl) {
		return await Ctrl.Parent.Id == await te.Ctrl(CTRL_TC).Id;
	},

	IsDark: async function () {
		var cl = await MainWindow.GetSysColor(COLOR_WINDOW);
		return (cl & 0xff) * 299 + (cl & 0xff00) * 2.29296875 + (cl & 0xff0000) * 0.001739501953125 < 127500;
	}
}
if (window.Addon == 1) {
	AddEvent("Arrange", Addons.InactivePane.Arrange);

	AddEvent("VisibleChanged", function (Ctrl) {
		if (Ctrl.Visible) {
			Addons.InactivePane.Arrange(Ctrl);
		}
	});

	AddEventId("AddonDisabledEx", "inactivepane", async function () {
		for (let i = await cTC.Count; i-- > 0;) {
			const TC = await cTC[i];
			if (TC) {
				Addons.InactivePane.Active(await TC.Selected, await TC.Selected.hwndList);
			}
		}
	});

	AddEvent("Load", async function () {
		let cl = Addons.InactivePane.TextColor;
		const bDark = await Addons.InactivePane.IsDark();
		Addons.InactivePane.TextColor = cl ? await GetWinColor(cl) : bDark ? 0xaaaaaa : 0x444444;
		cl = Addons.InactivePane.Color;
		Addons.InactivePane.Color = cl ? await GetWinColor(cl) : bDark ? 0x444444 : 0xaaaaaa;
		const cTC = te.Ctrls(CTRL_TC, true);
		for (let i = await cTC.Count; i-- > 0;) {
			const TC = await cTC[i];
			if (TC) {
				Addons.InactivePane.Arrange(await TC.Selected);
			}
		}
	});
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
	const bDark = await Addons.InactivePane.IsDark();
	document.getElementById("TextColor").setAttribute("placeholder", GetWebColor(bDark ? 0xaaaaaa : 0x444444));
	document.getElementById("Color").setAttribute("placeholder", GetWebColor(bDark ? 0x444444 : 0xaaaaaa));
}
