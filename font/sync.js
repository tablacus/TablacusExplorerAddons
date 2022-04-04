const Addon_Id = "font";
const item = GetAddonElement(Addon_Id);

Sync.Font = {
	TreeHeight: GetNum(item.getAttribute("TreeHeight")),
	FrameHeight: GetNum(item.getAttribute("FrameHeight")),

	Exec: function (Ctrl) {
		const FV = GetFolderView(Ctrl);
		if (FV) {
			const hwnd = FV.hwndList;
			if (hwnd) {
				const hFont = api.SendMessage(hwnd, WM_GETFONT, 0, 0);
				if (hFont != Sync.Font.hFont) {
					api.SendMessage(hwnd, WM_SETFONT, Sync.Font.hFont, 1);
				}
			}
			if (Ctrl.TreeView) {
				Sync.Font.SetTV(Ctrl.TreeView.hwndTree, Sync.Font.TreeHeight);
			}
			Sync.Font.SetFrame(FV);
		}
	},

	SetFrame: function (FV) {
		if (FV.Type == CTRL_EB) {
			Sync.Font.SetTV(FindChildByClass(FV.hwnd, WC_TREEVIEW), Sync.Font.FrameHeight);
		}
	},

	SetTV: function (hwnd, nHeight) {
		if (hwnd) {
			const hFont = api.SendMessage(hwnd, WM_GETFONT, 0, 0);
			if (hFont != Sync.Font.hFont) {
				api.SendMessage(hwnd, WM_SETFONT, Sync.Font.hFont, 1);
			}
			const dwStyle = api.GetWindowLongPtr(hwnd, GWL_STYLE);
			if (nHeight) {
				if (nHeight != api.SendMessage(hwnd, TVM_GETITEMHEIGHT, 0, 0)) {
					if (!(dwStyle & 0x4000)) {
						api.SetWindowLongPtr(hwnd, GWL_STYLE, dwStyle | 0x4000);
					}
					api.SendMessage(hwnd, TVM_SETITEMHEIGHT, nHeight, 0);
				}
			} else if (dwStyle & 0x4000) {
				api.SetWindowLongPtr(hwnd, GWL_STYLE, dwStyle & ~0x4000);
			}
		}
	},

	Init: function () {
		Sync.Font.hFont = CreateFont(DefaultFont);
		const cFV = te.Ctrls(CTRL_FV);
		for (let i in cFV) {
			Sync.Font.Exec(cFV[i]);
		}
	},

	Clear: function () {
		api.SystemParametersInfo(SPI_GETICONTITLELOGFONT, DefaultFont.Size, DefaultFont, 0);
		if (Sync.Font.TreeHeight) {
			Sync.Font.TreeHeight = -1;
		}
		Sync.Font.FrameHeight = 0;
		FontChanged();
	}
}

AddEvent("ListViewCreated", Sync.Font.Exec);

AddEvent("NavigateComplete", function(Ctrl) {
	if (api.PathIsNetworkPath(api.GetDisplayNameOf(Ctrl, SHGDN_FORPARSING))) {
		Sync.Font.Exec(Ctrl);
	}
});

AddEvent("ChangeView", Sync.Font.SetFrame);

AddEvent("Create", function (Ctrl) {
	if (Ctrl.Type <= CTRL_EB) {
		Sync.Font.Exec(Ctrl);
		return;
	}
	if (Ctrl.Type == CTRL_TV) {
		Sync.Font.SetTV(Ctrl.hwndTree, Sync.Font.TreeHeight);
	}
});

AddEvent("FontChanged", Sync.Font.Init);

AddEventId("AddonDisabledEx", "font", Sync.Font.Clear);

DefaultFont.lfFaceName = item.getAttribute("Name") || DefaultFont.lfFaceName;
const h = item.getAttribute("Size");
if (h >= 6 && h <= 24) {
	DefaultFont.lfHeight = - (h * screen.deviceYDPI / 72);
}
DefaultFont.lfWeight = item.getAttribute("Weight") || DefaultFont.lfWeight;
DefaultFont.lfCharSet = item.getAttribute("CharSet") || 1;
Sync.Font.hFont = CreateFont(DefaultFont);
FontChanged();
