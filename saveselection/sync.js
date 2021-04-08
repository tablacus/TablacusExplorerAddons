const Addon_Id = "saveselection";
const item = GetAddonElement(Addon_Id);

Sync.SaveSelection = {
	path: OrganizePath(Addon_Id, BuildPath(te.Data.DataFolder, "config")) + ".tsv",
	db: {},

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const Items = Sync.SaveSelection.GetItems(FV);
		const hMenu = api.CreatePopupMenu();
		if (FV.ItemCount(SVGIO_SELECTION)) {
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("Save"));
		}
		if (Items) {
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, GetText("Select"));
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 3, GetText("Remove"));
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
			const mii = api.Memory("MENUITEMINFO");
			mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
			for (let i = 0; i < Items.Count; ++i) {
				const FolderItem = Items.Item(i);
				mii.wID = i + 9;
				mii.dwTypeData = GetFileName(FolderItem.Path);
				AddMenuIconFolderItem(mii, FolderItem);
				api.InsertMenuItem(hMenu, MAXINT, false, mii);
			}
		}
		if (!pt) {
			pt = api.Memory("POINT");
			api.GetCursorPos(pt);
		}
		const nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
		api.DestroyMenu(hMenu);
		switch (nVerb) {
			case 1:
				Sync.SaveSelection.Save(Ctrl, pt);
				break;
			case 2:
				Sync.SaveSelection.Restore(Ctrl, pt);
				break;
			case 3:
				Sync.SaveSelection.Remove(Ctrl, pt);
				break;
		}
		if (nVerb > 8) {
			FV.SelectItem(Items.Item(nVerb - 9), SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_SELECTIONMARK | SVSI_SELECT);
		}
	},

	GetItems: function (FV) {
		const path = api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		const Items = Sync.SaveSelection.db[path];
		if (/object|function/.test(typeof Items)) {
			return Items;
		}
		if ("string" === typeof Items) {
			if (FV.FolderItem.IsFolder) {
				FolderItems = api.CreateObject("FolderItems");
				const f = FV.FolderItem.GetFolder;
				const ar = Items.split("\t");
				if (ar.length) {
					for (let i = 0; i < ar.length; ++i) {
						const pid = f.ParseName(ar[i]);
						if (pid) {
							FolderItems.AddItem(pid);
						}
					}
					if (ar.length == FolderItems.Count) {
						Sync.SaveSelection.db[path] = FolderItems;
					}
				}
			}
			return FolderItems;
		}
	},

	Save: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const path = api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		Sync.SaveSelection.db[path] = FV.SelectedItems();
		Sync.SaveSelection.bSave = true;
	},

	Restore: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const Items = Sync.SaveSelection.GetItems(FV);
		if (Items && Items.Count) {
			FV.SelectItem(Items, SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS | SVSI_SELECTIONMARK | SVSI_SELECT);
		}
	},

	Remove: function (Ctrl, pt) {
		if (!confirmOk()) {
			return;
		}
		const FV = GetFolderView(Ctrl, pt);
		const path = api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		delete Sync.SaveSelection.db[path];
	},

	Clear: function () {
		Sync.SaveSelection.db = {};
	},

	Set: function (n, v) {
		Sync.SaveSelection.db[n] = v;
	},

	ENumCB: function (fncb) {
		for (let n in Sync.SaveSelection.db) {
			let v = Sync.SaveSelection.db[n];
			if ("string" !== typeof v) {
				if (!v.Item(-1).IsFolder || !v.Item(-1).IsFileSystem) {
					continue;
				}
				const ar = [];
				for (let i = 0; i < v.Count; ++i) {
					ar.push(GetFileName(v.Item(i).Path));
				}
				v = ar.join("\t");
			}
			if (api.Invoke(fncb, [n, v]) < 0) {
				break;
			}
		}
	}
}

AddEvent("Load", function () {
	LoadDBFromTSV(Sync.SaveSelection, Sync.SaveSelection.path);
});

AddEvent("SaveConfig", function () {
	if (Sync.SaveSelection.bSave) {
		Sync.SaveSelection.bSave = false;
		SaveDBToTSV(Sync.SaveSelection, Sync.SaveSelection.path);
	}
});
