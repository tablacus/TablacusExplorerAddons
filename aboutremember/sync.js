var Addon_Id = "aboutremember";
var item = GetAddonElement(Addon_Id);

Sync.AboutRemember = {
	PATH: "about:remember",

	IsHandle: function (Ctrl) {
		return SameText("string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), Sync.AboutRemember.PATH);
	},

	Edit: function (Ctrl, pt) {
		if (!Sync.AboutRemember || !Sync.AboutRemember.IsHandle(Ctrl)) {
			return;
		}
		var Selected = GetSelectedArray(Ctrl, pt, true).shift();
		if (Selected && Selected.Count) {
			var path1 = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
			var path = te.Data.AddonsData.AboutRemember[path1];
			var opt = api.CreateObject("Object");
			opt.MainWindow = MainWindow;
			opt.path = path;
			opt.width = 640;
			opt.height = 360;
			ShowDialog("../addons/aboutremember/dialog.html", opt);
		}
	},

	Remove: function (Ctrl, pt) {
		if (!Sync.AboutRemember || !Sync.AboutRemember.IsHandle(Ctrl) || !confirmOk("Are you sure?")) {
			return;
		}
		var ar = GetSelectedArray(Ctrl, pt, true);
		var Selected = ar[0];
		var FV = ar[2];
		FV.Parent.LockUpdate();
		for (var j = Selected.Count; j--;) {
			var Item = Selected.Item(j);
			FV.RemoveItem(Item);
			var path1 = Item.Path;
			var path = te.Data.AddonsData.AboutRemember[path1];
			api.ObjDelete(Common.Remember.db, path);
			api.ObjDelete(te.Data.AddonsData.AboutRemember, path1);
		}
		FV.Parent.UnlockUpdate();
	},
}

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (Sync.AboutRemember.IsHandle(Path)) {
		if (Sync.Remember) {
			Ctrl.Enum = function (pid, Ctrl, fncb) {
				te.Data.AddonsData.AboutRemember = api.CreateObject("Object");
				var Items = api.CreateObject("FolderItems");
				for (var path in Common.Remember.db) {
					var ar = Common.Remember.db[path];
					if (ar) {
						var Item = /^([1-9]+\d*)$/.test(path) ? api.ILCreateFromPath(path) : api.SHSimpleIDListFromPath(path, FILE_ATTRIBUTE_DIRECTORY, ar[0], 0);
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

AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple) {
	if (Sync.AboutRemember.IsHandle(Ctrl)) {
		return MakeImgDataEx("folder:closed", bSimple, 16);
	}
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	if (Sync.AboutRemember.IsHandle(Ctrl)) {
		RemoveCommand(hMenu, ContextMenu, "delete;rename");
		if (te.Data.AddonsData.AboutRemember) {
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Edit"));
			ExtraMenuCommand[nPos] = Sync.AboutRemember.Edit;
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Remove"));
			ExtraMenuCommand[nPos] = Sync.AboutRemember.Remove;
		}
	}
	return nPos;
});

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
		var FV = ContextMenu.FolderView;
		if (FV && Sync.AboutRemember.IsHandle(FV)) {
			return S_OK;
		}
	}
	if (!Verb) {
		if (ContextMenu.Items.Count >= 1) {
			var path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
			if (Sync.AboutRemember.IsHandle(path)) {
				var FV = te.Ctrl(CTRL_FV);
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
