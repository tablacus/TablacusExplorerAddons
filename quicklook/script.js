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
		Key: item.getAttribute("Key"),

		Exec: function (Ctrl, pt) {
			Addons.QuickLook.SendMessage(GetFolderView(Ctrl, pt), "Toggle");
			return S_OK;
		},

		ExecMenu: function (Ctrl, pt) {
			Addons.QuickLook.SendMessage(null, "Toggle", (g_.MenuSelected || {}).Path);
			return S_OK;
		},

		SendMessage: function (FV, Mode, Path) {
			if (!Path) {
				if (!FV) {
					FV = te.Ctrl(CTRL_FV);
				}
				var Items = FV.SelectedItems();
				if (!Items || !Items.Count) {
					Items = FV.Items();
				}
				if (Items && Items.Count) {
					Path = Items.Item(0).Path;
				} else {
					Path = FV.FolderItem.Path;
				}
			}
			if (Mode == "Switch" && Addons.QuickLook.Path == Path) {
				return;
			}
			Addons.QuickLook.Path = Path;
			var wfd = api.Memory("WIN32_FIND_DATA");
			var hFind = api.FindFirstFile("\\\\.\\pipe\\*", wfd);			
			var strPipe;
			for (var bFind = hFind != INVALID_HANDLE_VALUE; bFind; bFind = api.FindNextFile(hFind, wfd)) {
				if (/QuickLook\.App\.Pipe\./i.test(wfd.cFileName)) {
					strPipe = wfd.cFileName;
					break;
				}
			} 
			api.FindClose(hFind);
			if (strPipe) {
				var hFile = api.CreateFile(["\\\\.\\pipe\\", strPipe].join(""), 0x40000000, 0, null, 3, FILE_ATTRIBUTE_NORMAL, null);
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
		SetKeyExec("Menus", item.getAttribute("Key"), Addons.QuickLook.ExecMenu, "Func");
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
