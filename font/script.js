var Addon_Id = "font";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Font =
	{
		TreeHeight: api.LowPart(item.getAttribute("TreeHeight")),
		FrameHeight: api.LowPart(item.getAttribute("FrameHeight")),

		Exec: function (Ctrl) {
			var FV = GetFolderView(Ctrl);
			if (FV) {
				var hwnd = FV.hwndList;
				if (hwnd) {
					var hFont = api.SendMessage(hwnd, WM_GETFONT, 0, 0);
					if (hFont != Addons.Font.hFont) {
						api.SendMessage(hwnd, WM_SETFONT, Addons.Font.hFont, 1);
					}
				}
				if (Ctrl.TreeView) {
					Addons.Font.SetTV(Ctrl.TreeView.hwndTree, Addons.Font.TreeHeight);
				}
				Addons.Font.SetFrame(FV);
			}
		},

		SetFrame: function (FV) {
			if (FV.Type == CTRL_EB) {
				Addons.Font.SetTV(FindChildByClass(FV.hwnd, WC_TREEVIEW), Addons.Font.FrameHeight);
			}
		},

		SetTV: function (hwnd, nHeight) {
			if (hwnd) {
				var hFont = api.SendMessage(hwnd, WM_GETFONT, 0, 0);
				if (hFont != Addons.Font.hFont) {
					api.SendMessage(hwnd, WM_SETFONT, Addons.Font.hFont, 1);
				}
				var dwStyle = api.GetWindowLongPtr(hwnd, GWL_STYLE);
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
			Addons.Font.hFont = CreateFont(DefaultFont);
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				Addons.Font.Exec(cFV[i]);
			}
		},

		Clear: function () {
			api.SystemParametersInfo(SPI_GETICONTITLELOGFONT, DefaultFont.Size, DefaultFont, 0);
			if (Addons.Font.TreeHeight) {
				Addons.Font.TreeHeight = -1;
			}
			Addons.Font.FrameHeight = 0;
			FontChanged();
		}
	}

	AddEvent("ListViewCreated", Addons.Font.Exec);

	AddEvent("ChangeView", Addons.Font.SetFrame);

	AddEvent("Create", function (Ctrl) {
		if (Ctrl.Type <= CTRL_EB) {
			Addons.Font.Exec(Ctrl);
			return;
		}
		if (Ctrl.Type == CTRL_TV) {
			Addons.Font.SetTV(Ctrl.hwndTree, Addons.Font.TreeHeight);
		}
	});

	AddEvent("FontChanged", Addons.Font.Init);

	AddEventId("AddonDisabledEx", "font", Addons.Font.Clear);

	DefaultFont.lfFaceName = item.getAttribute("Name") || DefaultFont.lfFaceName;
	var h = item.getAttribute("Size");
	if (h >= 6 && h <= 24) {
		DefaultFont.lfHeight = - (h * screen.logicalYDPI / 72);
	}
	DefaultFont.lfWeight = item.getAttribute("Weight") || DefaultFont.lfWeight;
	DefaultFont.lfCharSet = 1;
	document.body.style.fontFamily = DefaultFont.lfFaceName;
	document.body.style.fontSize = Math.abs(DefaultFont.lfHeight) + "px";
	document.body.style.fontWeight = DefaultFont.lfWeight || 400;
	Addons.Font.hFont = CreateFont(DefaultFont);
	FontChanged();
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
