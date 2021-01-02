const Addon_Id = "speeddial";
const item = GetAddonElement(Addon_Id);

Sync.SpeedDial = {
	SAVE: 512,
	DISP: 10,
	PATH: "about:newtab",
	CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\speeddial.tsv"),
	db: [],
	bSave: false,
	Prev: null,

	IsHandle: function (Ctrl) {
		return SameText("string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), Sync.SpeedDial.PATH);
	},

	IsDisp: function (path) {
		if (!api.PathMatchSpec(path, "\\\\*")) {
			if (api.PathMatchSpec(path, "?:\\*")) {
				try {
					const d = fso.GetDrive(fso.GetDriveName(path));
					return d.DriveType == 2;
				} catch (e) {
					return false;
				}
			}
			return true;
		}
		return false;
	}

}
try {
	const f = fso.OpenTextFile(Sync.SpeedDial.CONFIG, 1, false, -1);
	let s;
	while (s = f.ReadLine()) {
		Sync.SpeedDial.db.push(s.replace(/\t.*$/, ""));
	}
	f.Close();
} catch (e) {
	f && f.Close();
}

AddEvent("SaveConfig", function () {
	if (Sync.SpeedDial.bSave) {
		try {
			const f = fso.OpenTextFile(Sync.SpeedDial.CONFIG, 2, true, -1);
			for (let i in Sync.SpeedDial.db) {
				const path = Sync.SpeedDial.db[i];
				if (Sync.SpeedDial.IsDisp(path)) {
					f.WriteLine(path);
				}
			}
			f.Close();
		} catch (e) { }
	}
});

AddEvent("NavigateComplete", function (Ctrl) {
	if (!Sync.SpeedDial.IsHandle(Ctrl)) {
		const path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
		if (path != "" && IsSavePath(path) && Sync.SpeedDial.IsDisp(path)) {
			Sync.SpeedDial.db.unshift(path);
			Sync.SpeedDial.db.splice(Sync.SpeedDial.SAVE, MAXINT);
			Sync.SpeedDial.bSave = true;
		}
	}
});

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (Sync.SpeedDial.IsHandle(Path)) {
		Ctrl.Enum = function (pid, Ctrl, fncb) {
			const keys = [];
			const hash = {};
			for (let i in Sync.SpeedDial.db) {
				const path = Sync.SpeedDial.db[i];
				if (hash[path]) {
					hash[path]++;
				} else {
					hash[path] = 1;
				}
			}
			for (let i in hash) {
				keys.push(i);
			}
			keys.sort(function (a, b) {
				return hash[b] - hash[a];
			});
			for (let i = 0; i < keys.length; ++i) {
				if (!Sync.SpeedDial.IsDisp(keys[i])) {
					delete keys[i];
				}
			}
			return keys.slice(0, Sync.SpeedDial.DISP);
		};
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("GetTabName", function (Ctrl) {
	if (Sync.SpeedDial.IsHandle(Ctrl)) {
		return GetText("New Tab");
	}
}, true);

AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple) {
	if (Sync.SpeedDial.IsHandle(Ctrl)) {
		return MakeImgDataEx("bitmap:ieframe.dll,216,16,31", bSimple, 16);
	}
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	if (Sync.SpeedDial.IsHandle(Ctrl)) {
		RemoveCommand(hMenu, ContextMenu, "delete;rename");
	}
	return nPos;
});

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
		if (Sync.SpeedDial.IsHandle(Ctrl)) {
			if ((wParam & 0xfff) == CommandID_DELETE - 1) {
				return S_OK;
			}
		}
	}
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	if (Verb == CommandID_DELETE - 1) {
		const FV = ContextMenu.FolderView;
		if (FV && Sync.SpeedDial.IsHandle(FV)) {
			return S_OK;
		}
	}
	if (!Verb) {
		if (ContextMenu.Items.Count >= 1) {
			const path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			if (Sync.SpeedDial.IsHandle(path)) {
				const FV = te.Ctrl(CTRL_FV);
				FV.Navigate(path, SBSP_SAMEBROWSER);
				return S_OK;
			}
		}
	}
}, true);

if (!item.getAttribute("NoHome")) {
	HOME_PATH = Sync.SpeedDial.PATH;
}
if (item.getAttribute("AddToMenu")) {
	AddEvent("AddItems", function (Items, pid) {
		if (api.ILIsEqual(pid, ssfDRIVES)) {
			Items.AddItem(Sync.SpeedDial.PATH);
		}
	});
}
