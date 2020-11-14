var item = GetAddonElement("clipfolder");
if (!item.getAttribute("Set")) {
	item.setAttribute("Filter", "*.cfu");
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Background");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");

	item.setAttribute("MouseOn", "List");
}

Sync.ClipFolder = {
	FindItemIndex: function (FV, Item) {
		var Items = FV.Items();
		var path = Item.Path;
		for (var i = Items.Count; i-- > 0;) {
			if (path.toLowerCase() == Items.Item(i).Path.toLowerCase()) {
				return i;
			}
		}
		return -1;
	},

	IsHandle: function (Ctrl) {
		var path = Sync.ClipFolder.GetPath(Ctrl);
		return /^[A-Z]:\\|^\\\\/i.test(path) && api.PathMatchSpec(path, Sync.ClipFolder.Spec) && fso.FileExists(path);
	},

	GetPath: function (Ctrl) {
		return /string/i.test(typeof Ctrl) ? api.PathUnquoteSpaces(ExtractMacro(te, Ctrl)) : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
	},

	IsWritable: function (Ctrl) {
		var path = Sync.ClipFolder.GetPath(Ctrl);
		if (path) {
			var h = api.CreateFile(path, 0xc0000000, 7, null, 3, 0x02000000, null);
			if (h != INVALID_HANDLE_VALUE) {
				api.CloseHandle(h);
				return true;
			}
			return false;
		}
	},

	Enum: function (pid, Ctrl, fncb, SessionId) {
		var Items = te.FolderItems();
		Sync.ClipFolder.Open(pid, Items);
		return Items;
	},

	Add: function (Ctrl, Items) {
		if (/string/i.test(typeof Items)) {
			var arg = api.CommandLineToArgv(api.PathUnquoteSpaces(ExtractMacro(te, Items)));
			Items = te.FolderItems();
			for (var i in arg) {
				if (arg[i]) {
					Items.AddItem(arg[i]);
				}
			}
		}
		if (Items.Count == 0 || !Sync.ClipFolder.IsHandle(Ctrl)) {
			return;
		}
		if (!Sync.ClipFolder.IsWritable(Ctrl)) {
			return S_OK;
		}
		var db = {};
		Sync.ClipFolder.Open(Ctrl, null, db);

		var AddItems = te.FolderItems();
		for (var j = 0; j < Items.Count; j++) {
			var Item = Items.Item(j);
			var path = Item.Path;
			if (!db[path]) {
				db[path] = 1;
				AddItems.AddItem(Item);
			}
		}
		if (AddItems.Count) {
			Sync.ClipFolder.Save(Ctrl, db);
			var arFV = Sync.ClipFolder.SyncFV(Ctrl);
			for (var i in arFV) {
				arFV[i].AddItems(AddItems, true, function (FV, Items, ProgressDialog) {
					FV.SelectItem(null, SVSI_DESELECTOTHERS);
					var FVItems = FV.Items;
					if (Items.Count < 9) {
						for (var k = 0; k < Items.Count; k++) {
							var l = Sync.ClipFolder.FindItemIndex(FV, Items.Item(k));
							if (l >= 0) {
								FV.SelectItem(FVItems.Item(l), SVSI_SELECT | SVSI_FOCUSED | SVSI_ENSUREVISIBLE);
							}
						}
					}
				});
			}
		}
	},

	Remove: function (Ctrl, pt) {
		if (!Sync.ClipFolder.IsHandle(Ctrl)) {
			return;
		}
		if (!Sync.ClipFolder.IsWritable(Ctrl) || !confirmOk("Are you sure?")) {
			return S_OK;
		}
		var ar = GetSelectedArray(Ctrl, pt, true);
		var Selected = ar[0];
		FV = ar[2];
		var db = {};
		var bSave = false;
		Sync.ClipFolder.Open(FV, null, db);
		var arFV = Sync.ClipFolder.SyncFV(FV);
		for (var i in arFV) {
			arFV[i].Parent.LockUpdate();
			try {
				for (var j = Selected.Count; j--;) {
					arFV[i].RemoveItem(Selected.Item(j));
					var path = Selected.Item(j).Path;
					if (db[path]) {
						delete db[path];
						bSave = true;
					}
				}
			} catch (e) { }
			arFV[i].Parent.UnlockUpdate();
		}
		if (bSave) {
			Sync.ClipFolder.Save(FV, db);
		}
		return S_OK;
	},

	Paste: function (Ctrl, pt) {
		var FV = GetFolderView(Ctrl, pt);
		Sync.ClipFolder.Add(FV, api.OleGetClipboard());
		return S_OK;
	},

	PasteEx: function (Ctrl, pt) {
		var FV = GetFolderView(Ctrl, pt);
		var Selected = FV.SelectedItems();
		if (!Selected.Count || !Selected.Item(0).IsFolder) {
			return Sync.ClipFolder.Paste(FV);
		}
	},

	SyncFV: function (Ctrl) {
		var arFV = Ctrl.Id ? [Ctrl] : [];
		var path = Sync.ClipFolder.GetPath(Ctrl);
		if (path) {
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				if (Ctrl.Id != cFV[i].Id) {
					if (path.toLowerCase() == (cFV[i].FolderItem.Path || "").toLowerCase()) {
						arFV.push(cFV[i]);
					}
				}
			}
		}
		return arFV;
	},

	Open: function (Ctrl, Items, db) {
		if (!Sync.ClipFolder.IsHandle(Ctrl)) {
			return;
		}
		var path = Sync.ClipFolder.GetPath(Ctrl);
		var ado = api.CreateObject("ads");
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(path);
		while (!ado.EOS) {
			var s = ado.ReadText(adReadLine);
			if (s && !/^\s*#/.test(s)) {
				if (Items) {
					Items.AddItem(s);
				}
				if (db) {
					db[s] = 1;
				}
			}
		}
		ado.Close();
	},

	Save: function (Ctrl, db) {
		if (!Sync.ClipFolder.IsHandle(Ctrl)) {
			return;
		}
		var path = Sync.ClipFolder.GetPath(Ctrl);
		var ado = api.CreateObject("ads");
		ado.CharSet = "utf-8";
		ado.Open();
		for (var i in db) {
			ado.WriteText(i, adWriteLine);
		}
		try {
			ado.SaveToFile(path, adSaveCreateOverWrite);
		} catch (e) {
			ShowError(e, [GetText("Save"), path].join(": "));
		}
		ado.Close();
	},

	Exec: function (Ctrl, pt) {
		var FV = GetFolderView(Ctrl, pt);
		var path = api.GetDisplayNameOf(FV, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
		if (/^[A-Z]:\\|^\\/i.test(path)) {
			if (Sync.ClipFolder.IsHandle(path)) {
				var db = {};
				var Items = FV.Items();
				for (var i = 0; i < Items.Count; i++) {
					db[api.GetDisplayNameOf(Items.Item(i), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL)] = 1;
				}
				Sync.ClipFolder.Save(FV, db);
			} else {
				var path2 = InputDialog(GetText("Create clip folder"), "");
				if (path2) {
					if (!/^[A-Z]:\\|^\\/i.test(path2)) {
						path2 = BuildPath(path, path2.replace(/^\s+/, ""));
					}
					CreateFile(path2 + (fso.GetExtensionName(path2) || Sync.ClipFolder.Spec.replace(/[\*\?]|;.*$/g, "")));
				}
			}
		}
		return S_OK;
	},

	Command: function (Ctrl, Verb, Paste) {
		if (Ctrl && Ctrl.Type <= CTRL_EB && Sync.ClipFolder.IsHandle(Ctrl)) {
			switch (Verb + 1) {
				case CommandID_PASTE:
					return Paste(Ctrl);
					break;
				case CommandID_DELETE:
					return Sync.ClipFolder.Remove(Ctrl);
			}
		}
	}
};

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (Sync.ClipFolder.IsHandle(Path)) {
		Ctrl.Enum = Sync.ClipFolder.Enum;
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
		if (Sync.ClipFolder.IsHandle(Ctrl)) {
			Sync.ClipFolder.dwEffect = Sync.ClipFolder.IsWritable(Ctrl) ? DROPEFFECT_LINK : DROPEFFECT_NONE;
			pdwEffect[0] = Sync.ClipFolder.dwEffect;
			return S_OK;
		}
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type <= CTRL_EB) {
		if (Sync.ClipFolder.IsHandle(Ctrl)) {
			if (Ctrl.HitTest(pt, LVHT_ONITEM) < 0) {
				pdwEffect[0] = Sync.ClipFolder.dwEffect;
				return S_OK;
			}
		}
	}
	if (Ctrl.Type == CTRL_DT) {
		if (Sync.ClipFolder.IsHandle(Ctrl)) {
			pdwEffect[0] = Sync.ClipFolder.dwEffect;
			return S_OK;
		}
	}
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Sync.ClipFolder.IsHandle(Ctrl)) {
		var nIndex = -1;
		if (Ctrl.Type <= CTRL_EB) {
			nIndex = Ctrl.HitTest(pt, LVHT_ONITEM);
		} else if (Ctrl.Type != CTRL_DT) {
			return S_OK;
		}
		if (nIndex < 0) {
			Sync.ClipFolder.Add(Ctrl, dataObj);
		}
		return S_OK;
	}
});

AddEvent("DragLeave", function (Ctrl) {
	return S_OK;
});

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	return Sync.ClipFolder.Command(Ctrl, wParam & 0xfff, Sync.ClipFolder.Paste);
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	return Sync.ClipFolder.Command(ContextMenu.FolderView, Verb, Sync.ClipFolder.PasteEx);
}, true);

AddEvent("DefaultCommand", function (Ctrl, Selected) {
	if (Selected.Count == 1) {
		var path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
		if (Sync.ClipFolder.IsHandle(path)) {
			Ctrl.Navigate(path);
			return S_OK;
		}
	}
}, true);

AddEvent("ILGetParent", function (FolderItem) {
	var path = FolderItem.Path;
	if (Sync.ClipFolder.IsHandle(path)) {
		return GetParentFolderName(path);
	}
});

AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple) {
	if (Sync.ClipFolder.IsHandle(Ctrl)) {
		return MakeImgDataEx("bitmap:ieframe.dll,699,16,15", bSimple, 16);
	}
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	if (Sync.ClipFolder.IsHandle(Ctrl)) {
		RemoveCommand(hMenu, ContextMenu, "delete;rename");
		api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
		ExtraMenuCommand[nPos] = OpenContains;
		if (Sync.ClipFolder.IsWritable(Ctrl)) {
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText('Remove'));
			ExtraMenuCommand[nPos] = Sync.ClipFolder.Remove;
		}
	}
	return nPos;
});

AddEvent("BeginLabelEdit", function (Ctrl, Name) {
	if (Ctrl.Type <= CTRL_EB) {
		if (Sync.ClipFolder.IsHandle(Ctrl)) {
			return 1;
		}
	}
});

AddEvent("Edit", function (Ctrl, hMenu, nPos, Selected, item) {
	if (Sync.ClipFolder.IsHandle(Ctrl)) {
		var Items = api.OleGetClipboard();
		if (Items && Items.Count) {
			for (var i = api.GetMenuItemCount(hMenu); i-- > 0;) {
				if (/Ctrl\+V/i.test(api.GetMenuString(hMenu, i, MF_BYPOSITION))) {
					api.EnableMenuItem(hMenu, i, MF_BYPOSITION | MF_ENABLED);
				}
			}
		}
	}
	return nPos;
});

AddEvent("Menus", function (Ctrl, hMenu, nPos, Selected, SelItem, ContextMenu, Name, pt) {
	if (/Background|Edit/i.test(Name)) {
		var FV = GetFolderView(Ctrl, pt);
		if (Sync.ClipFolder.IsHandle(FV) && Sync.ClipFolder.IsWritable(FV)) {
			var Items = api.OleGetClipboard();
			if (Items && Items.Count) {
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_ID | MIIM_STATE;
				var paste = api.LoadString(hShell32, 33562) || "&Paste";
				for (var i = api.GetMenuItemCount(hMenu); i-- > 0;) {
					api.GetMenuItemInfo(hMenu, i, true, mii);
					if (mii.fState & MFS_DISABLED) {
						var s = api.GetMenuString(hMenu, i, MF_BYPOSITION);
						if (s && s.indexOf(paste) == 0) {
							api.EnableMenuItem(hMenu, i, MF_ENABLED | MF_BYPOSITION);
							ExtraMenuCommand[mii.wID] = Sync.ClipFolder.Paste;
						}
					}
				}
			}
		}
	}
	return nPos;
});

Sync.ClipFolder.Spec = item.getAttribute("Filter") || "*.cfu";
Sync.ClipFolder.strName = item.getAttribute("MenuName") || GetText("Create clip folder...");
Sync.ClipFolder.strName2 = item.getAttribute("MenuName2") || GetText("Save clip folder");
//Menu
if (item.getAttribute("MenuExec")) {
	Sync.ClipFolder.nPos = api.LowPart(item.getAttribute("MenuPos"));
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		var path = api.GetDisplayNameOf(item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
		if (/^[A-Z]:\\|^\\/i.test(path)) {
			if (Sync.ClipFolder.IsWritable(Ctrl)) {
				api.InsertMenu(hMenu, Sync.ClipFolder.nPos, MF_BYPOSITION | MF_STRING, ++nPos, api.PathMatchSpec(path, Sync.ClipFolder.Spec) ? Sync.ClipFolder.strName2 : Sync.ClipFolder.strName);
				ExtraMenuCommand[nPos] = Sync.ClipFolder.Exec;
			}
		}
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.ClipFolder.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.ClipFolder.Exec, "Func");
}

AddTypeEx("Add-ons", "Create clip folder...", Sync.ClipFolder.Exec);
