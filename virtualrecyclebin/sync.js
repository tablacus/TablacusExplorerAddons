const Addon_Id = "virtualrecyclebin";
const item = GetAddonElement(Addon_Id);

Sync.VirtualRecycleBin = {
	nPos: 0,
	Path: item.getAttribute("Path") || "recyclebin",
	Use: [0, !item.getAttribute("NoRemovable"), 0, !item.getAttribute("NoNetwork")],
	nPos: GetNum(item.getAttribute("MenuPos")),
	Filter: ExtractFilter(item.getAttribute("Filter") || "*"),
	Disable: ExtractFilter(item.getAttribute("Disable") || "-"),

	Get: function (path) {
		if (!PathMatchEx(path, Sync.VirtualRecycleBin.Filter) || PathMatchEx(path, Sync.VirtualRecycleBin.Disable)) {
			return;
		}
		const drive = fso.GetDriveName(path);
		if (drive) {
			try {
				const d = fso.GetDrive(drive);
				if (d.IsReady && Sync.VirtualRecycleBin.Use[d.DriveType]) {
					let path1 = Sync.VirtualRecycleBin.Path;
					if (!/^[A-Z]:\\|^\\\\/i.test(path1)) {
						path1 = BuildPath(drive + "\\", path1);
					}
					return path1;
				}
			} catch (e) { }
		}
	},

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			const path = Sync.VirtualRecycleBin.Get(FV.FolderItem.Path);
			if (path && fso.FolderExists(path)) {
				FV.Navigate(path, SBSP_NEWBROWSER);
			}
		}
		return S_OK;
	},

	FO: function (Items) {
		if (Items.pdwEffect[0] && api.GetKeyState(VK_SHIFT) >= 0) {
			let dest, dest1, arFrom = [];
			for (let i = Items.Count - 1; i >= 0; i--) {
				let path1 = Items.Item(i).Path;
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
			const path = Sync.VirtualRecycleBin.Get(dest);
			if (path) {
				for (let i in arFrom) {
					if (api.StrCmpNI(arFrom[i], path, path.length) == 0) {
						return;
					}
				}
				let message, n = arFrom.length;
				if (n == 1) {
					message = arFrom[0];
				} else {
					if (n > 999 && document.documentMode > 8) {
						n = n.toLocaleString();
					}
					message = api.sprintf(99, GetTextR("@shell32.dll,-38192[-6466|%s items]").replace("%1!ls!", "%s"), n);
				}
				if (confirmOk(api.LoadString(hShell32, 4369) + "\n" + message, Sync.VirtualRecycleBin.sName)) {
					CreateFolder2(path);
					api.SHFileOperation(FO_MOVE, arFrom.join("\0"), path, FOF_RENAMEONCOLLISION, true);
				}
				return S_OK;
			}
		}
	},

	EmptyRecycleBin: function () {
		let s, ar = [], hash = {};
		for (let i = "A".charCodeAt(0); i <= "Z".charCodeAt(0); i++) {
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

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (Ctrl.Type <= CTRL_EB) {
		if ((wParam & 0xfff) + 1 == CommandID_DELETE) {
			return Sync.VirtualRecycleBin.FO(Ctrl.SelectedItems());
		}
	}
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	if (Verb + 1 == CommandID_DELETE) {
		return Sync.VirtualRecycleBin.FO(ContextMenu.Items());
	}
}, true);

AddEvent("EmptyRecycleBin", Sync.VirtualRecycleBin.EmptyRecycleBin);

Sync.VirtualRecycleBin.sName = item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name;
//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		const path = Sync.VirtualRecycleBin.Get(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
		if (path && fso.FolderExists(path)) {
			api.InsertMenu(hMenu, Sync.VirtualRecycleBin.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.VirtualRecycleBin.sName);
			ExtraMenuCommand[nPos] = Sync.VirtualRecycleBin.Exec;
			return nPos;
		}
	});
}
