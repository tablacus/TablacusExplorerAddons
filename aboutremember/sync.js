const Addon_Id = "aboutremember";
const item = GetAddonElement(Addon_Id);

Sync.AboutRemember = {
	PATH: "about:remember",

	IsHandle: function (Ctrl) {
		return SameText("string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), Sync.AboutRemember.PATH);
	},

	Edit: function (Ctrl, pt) {
		Ctrl = GetFolderView(Ctrl, pt);
		if (!Sync.AboutRemember || !Sync.AboutRemember.IsHandle(Ctrl)) {
			return;
		}
		const Selected = GetSelectedArray(Ctrl, pt, true).shift();
		if (Selected && Selected.Count) {
			const path1 = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			const path = te.Data.AddonsData.AboutRemember[path1];
			const opt = api.CreateObject("Object");
			opt.MainWindow = MainWindow;
			opt.path = path;
			opt.width = 640;
			opt.height = 360;
			ShowDialog("../addons/aboutremember/dialog.html", opt);
		}
	},

	Remove: function (Ctrl, pt) {
		const ar = GetSelectedArray(Ctrl, pt, true);
		const Selected = ar[0];
		const FV = ar[2];
		if (!Sync.AboutRemember || !Sync.AboutRemember.IsHandle(FV) || !confirmOk()) {
			return;
		}
		FV.Parent.LockUpdate();
		for (let j = Selected.Count; j--;) {
			const Item = Selected.Item(j);
			FV.RemoveItem(Item);
			const path1 = Item.Path;
			const path = te.Data.AddonsData.AboutRemember[path1];
			api.ObjDelete(Common.Remember.db, path);
			api.ObjDelete(te.Data.AddonsData.AboutRemember, path1);
		}
		FV.Parent.UnlockUpdate();
	},

	ProcessMenu: function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
		const FV = GetFolderView(Ctrl);
		if (Sync.AboutRemember.IsHandle(FV)) {
			RemoveCommand(hMenu, ContextMenu, "delete;rename");
			if (te.Data.AddonsData.AboutRemember) {
				api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Edit"));
				ExtraMenuCommand[nPos] = Sync.AboutRemember.Edit;
				api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Remove"));
				ExtraMenuCommand[nPos] = Sync.AboutRemember.Remove;
			}
		}
		return nPos;
	}
}

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (Sync.AboutRemember.IsHandle(Path)) {
		if (Sync.Remember) {
			Ctrl.Enum = function (pid, Ctrl, fncb) {
				te.Data.AddonsData.AboutRemember = api.CreateObject("Object");
				const Items = api.CreateObject("FolderItems");
				for (let path in Common.Remember.db) {
					const ar = Common.Remember.db[path];
					if (ar) {
						const Item = /^([1-9]+\d*)$/.test(path) ? api.ILCreateFromPath(path) : api.SHSimpleIDListFromPath(path, FILE_ATTRIBUTE_DIRECTORY, ar[0], 0);
						Item.IsFolder;
						Items.AddItem(Item);
						te.Data.AddonsData.AboutRemember[Item.Path] = path;
					}
				}
				return Items;
			};
		}
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("GetTabName", function (Ctrl) {
	if (Sync.AboutRemember.IsHandle(Ctrl)) {
		return GetText("Remember");
	}
}, true);

AddEvent("GetIconImage", function (Ctrl, clBk, bSimple) {
	if (Sync.AboutRemember.IsHandle(Ctrl)) {
		return MakeImgDataEx("icon:shell32.dll,3", bSimple, 16, clBk);
	}
});

AddEvent("Context", Sync.AboutRemember.ProcessMenu);

AddEvent("File", Sync.AboutRemember.ProcessMenu);

AddEvent("BeginLabelEdit", function (Ctrl, Name) {
	if (Ctrl.Type <= CTRL_EB) {
		if (Sync.AboutRemember.IsHandle(Ctrl)) {
			return 1;
		}
	}
});
AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
		if (Sync.AboutRemember.IsHandle(Ctrl)) {
			if ((wParam & 0xfff) == CommandID_DELETE - 1) {
				Sync.AboutRemember.Remove(Ctrl);
				return S_OK;
			}
		}
	}
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	if (Verb == CommandID_DELETE - 1) {
		const FV = ContextMenu.FolderView;
		if (FV && Sync.AboutRemember.IsHandle(FV)) {
			Sync.AboutRemember.Remove(FV);
			return S_OK;
		}
	}
	if (!Verb) {
		if (ContextMenu.Items.Count >= 1) {
			const path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			if (Sync.AboutRemember.IsHandle(path)) {
				const FV = te.Ctrl(CTRL_FV);
				FV.Navigate(path, SBSP_SAMEBROWSER);
				return S_OK;
			}
		}
	}
}, true);

if (item.getAttribute("AddToMenu")) {
	AddEvent("AddItems", function (Items, pid) {
		if (api.ILIsEqual(pid, ssfDRIVES)) {
			Items.AddItem(Sync.AboutRemember.PATH);
		}
	});
}
