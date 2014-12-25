var Addon_Id = "font";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
}
if (window.Addon == 1) {
	Addons.Font =
	{
		Exec: function (Ctrl)
		{
			if (Ctrl) {
				if (Ctrl.Type == CTRL_TE) {
					Ctrl = te.Ctrl(CTRL_FV);
					if (!Ctrl) {
						return;
					}
				}
				if (Ctrl.Type == CTRL_TV) {
					Ctrl = Ctrl.FolderView;
				}
				var hwnd = Ctrl.hwndList;
				if (hwnd) {
					api.SendMessage(hwnd, WM_SETFONT, Addons.Font.hFont, 1);
					var nView = api.SendMessage(hwnd, LVM_GETVIEW, 0, 0);
					api.SendMessage(hwnd, LVM_SETVIEW, nView == 1 ? 3 : 1, 0);
					api.SendMessage(hwnd, LVM_SETVIEW, nView, 0);
				}
				if (Ctrl.TreeView) {
					hwnd = Ctrl.TreeView.hwndTree;
					if (hwnd) {
						api.SendMessage(hwnd, WM_SETFONT, Addons.Font.hFont, 1);
						api.SendMessage(hwnd, 0x111b, Addons.Font.nTreeHeight, 0);
					}
				}
				if (Ctrl.Type == CTRL_EB) {
					hwnd = FindChildByClass(Ctrl.hwnd, WC_TREEVIEW);
					if (hwnd) {
						api.SendMessage(hwnd, WM_SETFONT, Addons.Font.hFont, 1);
						api.SendMessage(hwnd, 0x111b, Addons.Font.nTreeHeight, 0);
					}
				}
			}
		},

		Init: function ()
		{
			Addons.Font.hFont = CreateFont(DefaultFont);
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				Addons.Font.Exec(cFV[i]);
			}
		}
	}

	AddEvent("ViewCreated", Addons.Font.Exec);

	AddEvent("AddonDisabled", function(Id)
	{
		if (api.strcmpi(Id, "font") == 0) {
			AddEventEx(window, "beforeunload", function ()
			{
				api.SystemParametersInfo(SPI_GETICONTITLELOGFONT, DefaultFont.Size, DefaultFont, 0);
				Addons.Font.Init();
			});
		}
	});

	if (item) {
		DefaultFont.lfFaceName = item.getAttribute("Name") || DefaultFont.lfFaceName;
		var h = item.getAttribute("Size");
		if (h >= 6 && h <= 18) {
			DefaultFont.lfHeight = - (h * screen.logicalYDPI / 72);
		}
		DefaultFont.lfCharSet = 1;
		document.body.style.fontFamily = DefaultFont.lfFaceName;
		document.body.style.fontSize = Math.abs(DefaultFont.lfHeight) + "px";
		var o = document.getElementById("Size");
		if (o) {
			o.style.fontSize = 1;
			o.innerHTML = "A";
			Addons.Font.nTreeHeight = o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI + 6, 0;
		}
		Addons.Font.Init();
		FontChanged();
	}
}
else {
	ChooseFont = function (o)
	{
		var lf = api.Memory("LOGFONT");
		lf.lfFaceName = document.F.Name.value || MainWindow.DefaultFont.lfFaceName;
		var h = document.F.Size.value;
		lf.lfHeight = h >= 6 && h <= 18 ? - (h * screen.logicalYDPI / 72) : MainWindow.DefaultFont.lfHeight;
		lf.lfCharSet = 1;
		var cf = api.Memory("CHOOSEFONT");
		cf.lStructSize = cf.Size;
		cf.hwndOwner = api.GetWindow(document);
		cf.lpLogFont = lf;
		cf.Flags = 0x2041;
		cf.nSizeMin = 6;
		cf.nSizeMax = 18;
		if (api.ChooseFont(cf) && lf.CharSet != 2) {
			document.F.Name.value = lf.lfFaceName;
			document.F.Size.value = Math.abs(Math.round(lf.lfHeight * 72 / screen.logicalYDPI));
		}
	}
}
