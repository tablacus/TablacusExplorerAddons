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
					api.SendMessage(hwnd, WM_SETFONT, Addons.Font.hFont, 1);
					var nView = api.SendMessage(hwnd, LVM_GETVIEW, 0, 0);
					api.SendMessage(hwnd, LVM_SETVIEW, nView == 1 ? 4 : 1, 0);
					api.SendMessage(hwnd, LVM_SETVIEW, nView, 0);
				}
				if (Ctrl.TreeView) {
					Addons.Font.SetTV(Ctrl.TreeView.hwndTree, Addons.Font.TreeHeight);
				}
				if (FV.Type == CTRL_EB) {
					Addons.Font.SetTV(FindChildByClass(FV.hwnd, WC_TREEVIEW), Addons.Font.FrameHeight);
				}
			}
		},

		SetTV: function (hwnd, nHeight) {
			if (hwnd) {
				api.SendMessage(hwnd, WM_SETFONT, Addons.Font.hFont, 1);
				if (nHeight) {
					api.SendMessage(hwnd, TVM_SETITEMHEIGHT, nHeight, 0);
				}
			}
		},

		Init: function () {
			Addons.Font.hFont = CreateFont(DefaultFont);
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				Addons.Font.Exec(cFV[i]);
			}
		}
	}

	AddEvent("ViewCreated", Addons.Font.Exec);

	AddEvent("Create", function (Ctrl) {
		if (Ctrl.Type <= CTRL_EB) {
			Addons.Font.Exec(Ctrl);
			return;
		}
		if (Ctrl.Type == CTRL_TV) {
			Addons.Font.SetTV(Ctrl.hwndTree, Addons.Font.TreeHeight);
		}
	});

	AddEventId("AddonDisabledEx", "font", function (Id) {
		api.SystemParametersInfo(SPI_GETICONTITLELOGFONT, DefaultFont.Size, DefaultFont, 0);
		if (Addons.Font.TreeHeight) {
			Addons.Font.TreeHeight = -1;
		}
		Addons.Font.FrameHeight = 0;
		Addons.Font.Init();
	});

	DefaultFont.lfFaceName = item.getAttribute("Name") || DefaultFont.lfFaceName;
	var h = item.getAttribute("Size");
	if (h >= 6 && h <= 18) {
		DefaultFont.lfHeight = - (h * screen.logicalYDPI / 72);
	}
	DefaultFont.lfWeight = item.getAttribute("Weight") || DefaultFont.lfWeight;
	DefaultFont.lfCharSet = 1;
	document.body.style.fontFamily = DefaultFont.lfFaceName;
	document.body.style.fontSize = Math.abs(DefaultFont.lfHeight) + "px";
	document.body.style.fontWeight = DefaultFont.lfWeight || 400;
	Addons.Font.Init();
	FontChanged();
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
