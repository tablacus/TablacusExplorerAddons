const Addon_Id = "rememberselection";
let item = GetAddonElement(Addon_Id);

Sync.RememberSelection = {
	path: OrganizePath(Addon_Id, BuildPath(te.Data.DataFolder, "config")) + ".tsv",
	db: {},
	nSave: item.getAttribute("Save") || 1000,

	Store: function (FV) {
		if (FV && FV.FolderItem && !FV.FolderItem.Unavailable) {
			const path = api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			const Selected = FV.SelectedItems();
			if (Selected.Count) {
				Selected.Data = new Date().getTime();
				Sync.RememberSelection.db[path] = Selected;
			} else {
				delete Sync.RememberSelection.db[path];
			}
			Sync.RememberSelection.bSave = true;
		}
	},

	Restore: function(Ctrl) {
		const Items = Sync.RememberSelection.GetItems(Ctrl);
		if (Items && Items.Count) {
			setTimeout(function (Ctrl, Items) {
				Ctrl.SelectItem(Items, SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS | SVSI_SELECTIONMARK | SVSI_SELECT);
			}, 99, Ctrl, Items);
		}
	},

	GetItems: function (FV) {
		const path = api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		const Items = Sync.RememberSelection.db[path];
		if (/object|function/.test(typeof Items)) {
			return Items;
		}
		if ("string" === typeof Items) {
			if (FV.FolderItem.IsFolder) {
				const FolderItems = api.CreateObject("FolderItems");
				const f = FV.FolderItem.GetFolder;
				const ar = Items.split("\t");
				FolderItems.Data = ar.shift();
				for (let i = 0; i < ar.length; ++i) {
					const pid = f.ParseName(ar[i]);
					if (pid) {
						FolderItems.AddItem(pid);
					}
				}
				if (ar.length == FolderItems.Count) {
					Sync.RememberSelection.db[path] = FolderItems;
				}
				return FolderItems;
			}
		}
	},

	Clear: function () {
		Sync.RememberSelection.db = {};
	},

	Set: function (n, v) {
		Sync.RememberSelection.db[n] = v;
	},

	ENumCB: function (fncb) {
		for (let n in Sync.RememberSelection.db) {
			let v = Sync.RememberSelection.db[n];
			if ("string" !== typeof v) {
				if (!v.Item(-1).IsFolder || !v.Item(-1).IsFileSystem) {
					continue;
				}
				const ar = [v.Data];
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
};

AddEvent("NavigateComplete", Sync.RememberSelection.Restore);

AddEvent("CloseView", function (Ctrl) {
	Sync.RememberSelection.Store(Ctrl)
});

AddEvent("SelectionChanged", function (Ctrl, uChange) {
	if (Ctrl.ItemCount && Ctrl.ItemCount(SVGIO_ALLVIEW)) {
		if (Ctrl.ItemCount(SVGIO_SELECTION)) {
			Sync.RememberSelection.Store(Ctrl);
		} else {
			setTimeout(Sync.RememberSelection.Store, ui_.DoubleClickTime, Ctrl);
		}
	}
});

if (Sync.RememberSelection.nSave) {
	AddEvent("Load", function () {
		LoadDBFromTSV(Sync.RememberSelection, Sync.RememberSelection.path);
	});

	AddEvent("SaveConfig", function () {
		if (Sync.RememberSelection.bSave) {
			Sync.RememberSelection.bSave = false;
			const ar = [];
			Sync.RememberSelection.ENumCB(function (n, s) {
				ar.push([n, s].join("\t") + "\r\n");
			});
			ar.sort(function (a, b) {
				return b.split("\t")[1] - a.split("\t")[1];
			});
			ar.splice(Sync.RememberSelection.nSave, ar.length);
			WriteTextFile(Sync.RememberSelection.path, ar.join(""));
		}
	});
}

delete item;
