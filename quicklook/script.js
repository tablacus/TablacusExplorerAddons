var Addon_Id = "quicklook";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "$39");

	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.QuickLook =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt) {
			Addons.QuickLook.SendMessage(GetFolderView(Ctrl, pt), "Toggle");
			return S_OK;
		},

		SendMessage: function (FV, Mode, Path) {
			if (!Path) {
				if (!FV) {
					FV = te.Ctrl(CTRL_FV);
				}
				var Selected = FV.SelectedItems();
				if (Selected && Selected.Count) {
					Path = Selected.Item(0).Path;
				}
			}
			if (Path) {
				var wfd = api.Memory("WIN32_FIND_DATA");
				var hFind = api.FindFirstFile("\\\\.\\pipe\\QuickLook.App.Pipe.*", wfd);
				if (hFind == INVALID_HANDLE_VALUE) {
					return;
				}
				api.FindClose(hFind);
				var hFile = api.CreateFile(["\\\\.\\pipe\\", wfd.cFileName].join(""), 0x40000000, 0, null, 3, FILE_ATTRIBUTE_NORMAL, null);
				if (hFile == INVALID_HANDLE_VALUE) {
					return;
				}
				api.WriteFile(hFile, api.WideCharToMultiByte(65001, ["QuickLook.App.PipeMessages.", Mode, "|", Path].join("")));
				api.CloseHandle(hFile);
			}
		},

	};

	AddEvent("StatusText", function (Ctrl, Text, iPart) {
		if (Ctrl.Path || Ctrl.Type <= CTRL_EB && Text) {
			var hwnd = api.GetTopWindow(null);
			do {
				if (api.PathMatchSpec(api.GetClassName(hwnd), "*QuickLook*")) {
					if (api.IsWindowVisible(hwnd)) {
						Addons.QuickLook.SendMessage(Ctrl, "Switch", Ctrl.Path);
						break;
					}
				}
			} while (hwnd = api.GetWindow(hwnd, GW_HWNDNEXT));
		}
	});

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon") || (h > 16 ? "bitmap:ieframe.dll,214,24,14" : "bitmap:ieframe.dll,216,16,14");
	s = ['<span class="button" id="WindowPreviewButton" onclick="Addons.QuickLook.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.QuickLook.strName, src: s }, h), '</span>'];
	SetAddon(Addon_Id, Default, s);

	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
			api.InsertMenu(hMenu, Addons.QuickLook.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.QuickLook.strName);
			ExtraMenuCommand[nPos] = Addons.QuickLook.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.QuickLook.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.QuickLook.Exec, "Func");
	}

	AddTypeEx("Add-ons", "QuickLook", Addons.QuickLook.Exec);
} else {
	EnableInner();
	SetTabContents(0, "General", '<input type="button" value="' + api.sprintf(99, GetText("Get %s..."), "QuickLook") + '" title="https://github.com/QL-Win/QuickLook/releases" onclick="wsh.Run(this.title)">');
}
