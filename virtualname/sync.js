const Addon_Id = "virtualname";
const item = GetAddonElement(Addon_Id);

Sync.VirtualName = {
	bSave: false,
	Filter: item.getAttribute("Filter") || "*",
	Portable: GetNum(item.getAttribute("Portable")),
	SyncItem: {},
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	Exec: function (Ctrl, pt) {
		const Selected = GetSelectedArray(Ctrl, pt, true).shift();
		if (Selected && Selected.Count) {
			const path = Selected.Item(0).Path;
			const n = Sync.VirtualName.DB.Get(path);
			InputDialog(path + "\n" + n, n, function (s) {
				if ("string" === typeof s) {
					Sync.VirtualName.DB.Set(path, s);
					Sync.VirtualName.DB.Save();
				}
			});
		}
		return S_OK;
	},

	SetFilters: function (s) {
		const cFV = te.Ctrls(CTRL_FV);
		for (let i in cFV) {
			const FV = cFV[i];
			if (FV.FolderItem && PathMatchEx(FV.FolderItem.Path, Sync.VirtualName.Filter)) {
				ColumnsReplace(FV, "Name", HDF_LEFT, Sync.VirtualName.ReplaceColumns);
			}
		}
	},

	ReplaceColumns: function (FV, pid, s) {
		return Sync.VirtualName.DB.Get(pid.Path);
	},

	SetSync: function (name, s) {
		this.SyncItem[name] = s;
		clearTimeout(this.tidSync);
		this.tidSync = setTimeout(function () {
			Sync.VirtualName.tidSync = null;
			Sync.VirtualName.SyncItem = {};
		}, 500);
	}
}

AddEvent("Load", function () {
	Sync.VirtualName.DB = new SimpleDB("virtualname");
	Sync.VirtualName.DB.Load();
	AddEvent("Finalize", Sync.VirtualName.DB.Close);

	const Installed0 = (Sync.VirtualName.DB.Get('%Installed%') || "").toUpperCase();
	const Installed1 = Sync.VirtualName.Portable ? fso.GetDriveName(api.GetModuleFileName(null)).toUpperCase() : "";
	if (Installed0 && Sync.VirtualName.Portable && Installed0 != Installed1) {
		Sync.VirtualName.DB.ENumCB(function (path, value) {
			const drv = fso.GetDriveName(path);
			if (drv.toUpperCase() == Installed0) {
				Sync.VirtualName.DB.Set(path);
				Sync.VirtualName.DB.Set(Installed1 + path.substr(drv.length), value);
			}
		});
	}
	if (Sync.VirtualName.Portable || Installed0) {
		Sync.VirtualName.DB.Set('%Installed%', Installed1);
	}
	Sync.VirtualName.SetFilters();
});

AddEvent("ChangeNotify", function (Ctrl, pidls) {
	if (Sync.VirtualName.DB) {
		if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
			let name = fso.GetFileName(pidls[0].Path);
			let s = Sync.VirtualName.DB.Get(pidls[0].Path);
			if (s) {
				Sync.VirtualName.SetSync(name, s);
			} else {
				name = fso.GetFileName(pidls[1].Path);
				s = Sync.VirtualName.SyncItem[name];
			}
			if (s) {
				Sync.VirtualName.DB.Set(pidls[1].Path, s);
			}
			Sync.VirtualName.DB.Set(pidls[0].Path, "");
		}
		if (pidls.lEvent & SHCNE_DELETE) {
			const name = fso.GetFileName(pidls[0].Path);
			Sync.VirtualName.SetSync(name, Sync.VirtualName.DB.Get(pidls[0].Path));
			Sync.VirtualName.DB.Set(pidls[0].Path, "");
		}
		if (pidls.lEvent & SHCNE_CREATE) {
			const name = fso.GetFileName(pidls[0].Path);
			const Item = Sync.VirtualName.SyncItem[name];
			if (Item) {
				Sync.VirtualName.DB.Set(pidls[0].Path, Item);
			}
		}
	}
});

AddEvent("ViewCreated", function (Ctrl) {
	if (Ctrl.FolderItem && PathMatchEx(Ctrl.FolderItem.Path, Sync.VirtualName.Filter)) {
		ColumnsReplace(Ctrl, "Name", HDF_LEFT, Sync.VirtualName.ReplaceColumns);
	}
});

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.VirtualName.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.VirtualName.strName);
		ExtraMenuCommand[nPos] = Sync.VirtualName.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.VirtualName.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.VirtualName.Exec, "Func");
}

AddTypeEx("Add-ons", "Virtual name", Sync.VirtualName.Exec);
