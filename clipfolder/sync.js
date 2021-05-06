const item = GetAddonElement("clipfolder");

Sync.ClipFolder = {
	nPos: GetNum(item.getAttribute("MenuPos")),
	Spec: item.getAttribute("Filter") || "*.cfu",
	strName: item.getAttribute("MenuName") || GetText("Create clip folder..."),
	strName2: item.getAttribute("MenuName2") || GetText("Save clip folder"),

	FindItemIndex: function (FV, Item) {
		const Items = FV.Items();
		const path = Item.Path;
		for (let i = Items.Count; i-- > 0;) {
			if (SameText(path, api.GetDisplayNameOf(Items.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING))) {
				return i;
			}
		}
		return -1;
	},

	IsHandle: function (Ctrl) {
		const path = Sync.ClipFolder.GetPath(Ctrl);
		return /^[A-Z]:\\|^\\\\/i.test(path) && api.PathMatchSpec(path, Sync.ClipFolder.Spec) && fso.FileExists(path);
	},

	GetPath: function (Ctrl) {
		return /string/i.test(typeof Ctrl) ? ExtractPath(te, Ctrl) : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
	},

	IsWritable: function (Ctrl) {
		const path = Sync.ClipFolder.GetPath(Ctrl);
		if (path) {
			const h = api.CreateFile(path, 0xc0000000, 7, null, 3, 0x02000000, null);
			if (h != INVALID_HANDLE_VALUE) {
				api.CloseHandle(h);
				return true;
			}
			return false;
		}
	},

	Enum: function (pid, Ctrl, fncb, SessionId) {
		const Items = api.CreateObject("FolderItems");
		Sync.ClipFolder.Open(pid, Items);
		return Items;
	},

	Add: function (Ctrl, Items) {
		if (/string/i.test(typeof Items)) {
			const arg = api.CommandLineToArgv(ExtractPath(te, Items));
			Items = te.FolderItems();
			for (let i in arg) {
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
		const db = {};
		Sync.ClipFolder.Open(Ctrl, null, db);

		const AddItems = te.FolderItems();
		for (let j = 0; j < Items.Count; j++) {
			const Item = Items.Item(j);
			const path = Item.Path;
			if (!db[path]) {
				db[path] = 1;
				AddItems.AddItem(Item);
			}
		}
		if (AddItems.Count) {
			Sync.ClipFolder.Save(Ctrl, db);
			const arFV = Sync.ClipFolder.SyncFV(Ctrl);
			for (let i in arFV) {
				arFV[i].AddItems(AddItems, true, function (FV, Items, ProgressDialog) {
					FV.SelectItem(null, SVSI_DESELECTOTHERS);
					const FVItems = FV.Items;
					if (Items.Count < 9) {
						for (let k = 0; k < Items.Count; k++) {
							const l = Sync.ClipFolder.FindItemIndex(FV, Items.Item(k));
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
		if (!Sync.ClipFolder.IsWritable(Ctrl) || !confirmOk()) {
			return S_OK;
		}
		const ar = GetSelectedArray(Ctrl, pt, true);
		const Selected = ar[0];
		const FV = ar[2];
		const db = {};
		let bSave = false;
		Sync.ClipFolder.Open(FV, null, db);
		const arFV = Sync.ClipFolder.SyncFV(FV);
		for (let i in arFV) {
			arFV[i].Parent.LockUpdate();
			try {
				for (let j = Selected.Count; j--;) {
					arFV[i].RemoveItem(Selected.Item(j));
					const path = Selected.Item(j).Path;
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
		const FV = GetFolderView(Ctrl, pt);
		Sync.ClipFolder.Add(FV, api.OleGetClipboard());
		return S_OK;
	},

	PasteEx: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const Selected = FV.SelectedItems();
		if (!Selected.Count || !Selected.Item(0).IsFolder) {
			return Sync.ClipFolder.Paste(FV);
		}
	},

	SyncFV: function (Ctrl) {
		const arFV = Ctrl.Id ? [Ctrl] : [];
		const path = Sync.ClipFolder.GetPath(Ctrl);
		if (path) {
			const cFV = te.Ctrls(CTRL_FV);
			for (let i in cFV) {
				if (Ctrl.Id != cFV[i].Id) {
					if (SameText(path, api.GetDisplayNameOf(cFV[i], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING))) {
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
		const path = Sync.ClipFolder.GetPath(Ctrl);
		const ado = api.CreateObject("ads");
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(path);
		while (!ado.EOS) {
			const s = ado.ReadText(adReadLine);
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
		const path = Sync.ClipFolder.GetPath(Ctrl);
		const ado = api.CreateObject("ads");
		ado.CharSet = "utf-8";
		ado.Open();
		for (let i in db) {
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
		const FV = GetFolderView(Ctrl, pt);
		const path = api.GetDisplayNameOf(FV, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
		if (/^[A-Z]:\\|^\\/i.test(path)) {
			if (Sync.ClipFolder.IsHandle(path)) {
				const db = {};
				const Items = FV.Items();
				for (let i = 0; i < Items.Count; i++) {
					db[api.GetDisplayNameOf(Items.Item(i), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR)] = 1;
				}
				Sync.ClipFolder.Save(FV, db);
			} else {
				InputDialog(GetText("Create clip folder"), "", function (path2) {
					if (path2) {
						if (!/^[A-Z]:\\|^\\/i.test(path2)) {
							path2 = BuildPath(path, path2.replace(/^\s+/, ""));
						}
						CreateFile(path2 + (fso.GetExtensionName(path2) || Sync.ClipFolder.Spec.replace(/[\*\?]|;.*$/g, "")));
					}
				});
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
		let nIndex = -1;
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
		const path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
		if (Sync.ClipFolder.IsHandle(path)) {
			Ctrl.Navigate(path);
			return S_OK;
		}
	}
}, true);

AddEvent("ILGetParent", function (FolderItem) {
	const path = FolderItem.Path;
	if (Sync.ClipFolder.IsHandle(path)) {
		return GetParentFolderName(path);
	}
});

AddEvent("GetIconImage", function (Ctrl, clBk, bSimple) {
	if (Sync.ClipFolder.IsHandle(Ctrl)) {
		return MakeImgDataEx("bitmap:ieframe.dll,699,16,15", bSimple, 16, clBk);
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
		const Items = api.OleGetClipboard();
		if (Items && Items.Count) {
			for (let i = api.GetMenuItemCount(hMenu); i-- > 0;) {
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
		const FV = GetFolderView(Ctrl, pt);
		if (Sync.ClipFolder.IsHandle(FV) && Sync.ClipFolder.IsWritable(FV)) {
			const Items = api.OleGetClipboard();
			if (Items && Items.Count) {
				const mii = api.Memory("MENUITEMINFO");
				mii.fMask = MIIM_ID | MIIM_STATE;
				const paste = api.LoadString(hShell32, 33562) || "&Paste";
				for (let i = api.GetMenuItemCount(hMenu); i-- > 0;) {
					api.GetMenuItemInfo(hMenu, i, true, mii);
					if (mii.fState & MFS_DISABLED) {
						const s = api.GetMenuString(hMenu, i, MF_BYPOSITION);
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

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		const path = api.GetDisplayNameOf(item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
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
