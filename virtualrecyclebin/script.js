var Addon_Id = "virtualrecyclebin";
var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Network", 1);
	item.setAttribute("Removable", 1);
	item.setAttribute("Path", "recyclebin");

	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Background");
	item.setAttribute("MenuPos", -1);
}

if (window.Addon == 1) {
	Addons.VirtualRecycleBin =
	{
		nPos: 0,
		Path: item.getAttribute("Path") || "recyclebin",
		Use: [0, api.LowPart(item.getAttribute("Removable")), 0, api.LowPart(item.getAttribute("Network"))],

		Get: function (path)
		{
			var drive = fso.GetDriveName(path);
			if (drive) {
				try {
					var d = fso.GetDrive(drive);
					if (d.IsReady && Addons.VirtualRecycleBin.Use[d.DriveType]) {
						var path1 = Addons.VirtualRecycleBin.Path;
						if (!/^[A-Z]:\\|^\\\\/i.test(path1)) {
							path1 = fso.BuildPath(drive + "\\", path1);
						}
						return path1;
					}
				} catch (e) {}
			}
		},

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				var path = Addons.VirtualRecycleBin.Get(FV.FolderItem.Path);
				if (path && fso.FolderExists(path)) {
					FV.Navigate(path, SBSP_NEWBROWSER);
				}
			}
			return S_OK;
		},

		FO: function (Items)
		{
			if (Items.pdwEffect[0] && api.GetKeyState(VK_SHIFT) >= 0) {
				var dest, dest1, arFrom = [];
				for (i = Items.Count - 1; i >= 0; i--) {
					var path1 = Items.Item(i).Path;
					if (IsExists(path1)) {
						dest1 = fso.GetDriveName(path1);
						if (!dest) {
							dest = dest1;
						}
						if (api.StrCmpI(dest, dest1)) {
							return;
						}
						arFrom.unshift(path1);
						continue;
					}
					return;
				}
				var path = Addons.VirtualRecycleBin.Get(dest);
				if (path) {
					for (var i in arFrom) {
						if (api.StrCmpNI(arFrom[i], path, path.length) == 0) {
							return;
						}
					}
					var message, n = arFrom.length;
					if (n == 1) {
						message = arFrom[0];
					} else {
						if (n > 999 && document.documentMode > 8) {
							n = n.toLocaleString();
						}
						message = api.sprintf(99, GetTextR("@shell32.dll,-38192[-6466|%s items]").replace("%1!ls!", "%s"), n);
					}
					if (confirmOk(api.LoadString(hShell32, 4369) + "\n" + message, Addons.VirtualRecycleBin.strName)) {
						CreateFolder2(path);
						api.SHFileOperation(FO_MOVE, arFrom.join("\0"), path, FOF_RENAMEONCOLLISION, true);
					}
					return S_OK;
				}
			}
		},

		EmptyRecycleBin: function ()
		{
			var s, ar = [], hash = {};
			for (var i = "A".charCodeAt(0); i <= "Z".charCodeAt(0); i++) {
				s = this.Get(String.fromCharCode(i) + ":\\");
				if (s && fso.FolderExists(s)) {
					hash[s] = 1;
				}
			}
			s = this.Get(te.Ctrl(CTRL_FV).FolderItem.Path);
			if (s && fso.FolderExists(s)) {
				hash[s] = 1;
			}
			for (s in hash) {
				ar.push(s)
			}
			ar.push("");
			api.SHFileOperation(FO_DELETE, ar.join("\\*\0"), null, 0, false);
		}
	};

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if ((wParam & 0xfff) + 1 == CommandID_DELETE) {
				return Addons.VirtualRecycleBin.FO(Ctrl.SelectedItems());
			}
		}
	}, true);

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		if (Verb + 1 == CommandID_DELETE) {
			return Addons.VirtualRecycleBin.FO(ContextMenu.Items());
		}
	}, true);

	AddEvent("EmptyRecycleBin", Addons.VirtualRecycleBin.EmptyRecycleBin);

	Addons.VirtualRecycleBin.strName = item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name);
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.VirtualRecycleBin.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			var path = Addons.VirtualRecycleBin.Get(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
			if (path && fso.FolderExists(path)) {
				api.InsertMenu(hMenu, Addons.VirtualRecycleBin.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.VirtualRecycleBin.strName);
				ExtraMenuCommand[nPos] = Addons.VirtualRecycleBin.Exec;
				return nPos;
			}
		});
	}
} else {
	SetTabContents(0, "General", '<input type="checkbox" id="Network" /><label for="Network">@shell32.dll,-9319[-9428]</label><br /><input type="checkbox" id="Removable" /><label for="Removable">@shell32.dll,-9309[-9396]</label><br /><label>Path</label><br /><input type="text" id="Path" style="width: 100%" />');
}
