const Addon_Id = "label";
const item = GetAddonElement(Addon_Id);

Common.Label = api.CreateObject("Object");
Sync.Label = {
	RE: /label:(.*)/i,
	CONFIG: BuildPath(te.Data.DataFolder, "config\\label.tsv"),
	Changed: {},
	Redraw: {},
	nPosAdd: 0,
	nPosDel: 0,
	tid2: null,
	tidSync: null,
	SyncItem: {},
	DB: new SimpleDB("label"),
	Portable: GetNum(item.getAttribute("Portable")),
	Icon: item.getAttribute("Icon") || (WINVER >= 0x600 ? "icon:shell32.dll,289" : "bitmap:ieframe.dll,206,16,18"),
	tid: {},

	IsHandle: function (Ctrl) {
		return Sync.Label.RE.exec("string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
	},

	IsWritable: function (Ctrl) {
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			const Label = Sync.Label.LabelPath(Ctrl);
			return Label && !/[\?\*;]/.test(Label) && api.CommandLineToArgv(Label).length == 1;
		}
	},

	Edit: function (Ctrl, pt) {
		const Selected = GetSelectedArray(Ctrl, pt, true).shift();
		if (Selected && Selected.Count) {
			try {
				const path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				if (path) {
					const Label = Sync.Label.DB.Get(path);
					InputDialog(path + (Selected.Count > 1 ? " : " + Selected.Count : "") + "\nlabel:" + Label, Label, function (s) {
						if ("string" === typeof s) {
							for (let i = Selected.Count; i-- > 0;) {
								Sync.Label.Set(api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL), s);
							}
						}
					});
				}
			} catch (e) {
				wsh.Popup(e.description + "\n" + s, 0, TITLE, MB_ICONSTOP);
			}
		}
	},

	EditPath: function (Ctrl, pt) {
		const Selected = GetSelectedArray(Ctrl, pt, true).shift();
		if (Selected && Selected.Count == 1) {
			try {
				const path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				if (path) {
					const Label = Sync.Label.DB.Get(path);
					InputDialog("label:" + Label + "\n" + path, path, function (s) {
						if ("string" === typeof s) {
							api.SHParseDisplayName(function (pid, s, path, Label) {
								if (pid) {
									s = api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
								}
								if (s != path) {
									if (Sync.Label.DB.Get(s)) {
										wsh.Popup(api.LoadString(hShell32, 6327));
									} else {
										Sync.Label.Set(s, Label);
										Sync.Label.Set(path, "");
									}
								}
							}, 0, s, s, path, Label);
						}
					});
				}
			} catch (e) {
				wsh.Popup(e.description + "\n" + s, 0, TITLE, MB_ICONSTOP);
			}
		}
	},

	Details: function (Ctrl, pt) {
		Ctrl.Columns = Ctrl.Columns + ' "System.Contact.Label" -1';
	},

	ExecRemoveItems: function (Ctrl, pt) {
		if (!confirmOk()) {
			return;
		}
		const ar = GetSelectedArray(Ctrl, pt);
		const Selected = ar.shift();
		const SelItem = ar.shift();
		const FV = ar.shift();
		const Label = Sync.Label.LabelPath(FV);
		if (Label) {
			Sync.Label.RemoveItems(Selected, Label);
		}
	},

	LabelPath: function (Ctrl) {
		const res = Sync.Label.IsHandle(Ctrl);
		if (res) {
			return res[1];
		}
	},

	AddMenu: function (hMenu, hParent, nIndex) {
		hMenu = api.sscanf(hMenu, "%llx");
		const oList = {};
		Sync.Label.List(oList);
		const nPos = g_nPos;
		let nRes = 0;
		const db = Common.Label.Groups;
		if (db) {
			const mii = api.Memory("MENUITEMINFO");
			mii.fMask = MIIM_STRING | MIIM_SUBMENU;
			db.ENumCB(function (n, v) {
				mii.hSubMenu = api.CreatePopupMenu();
				mii.dwTypeData = n.replace(/&/g, "&&");
				const ar = v.split(/\s*;\s*/);
				for (let i in ar) {
					nRes++;
					api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++g_nPos, ar[i].replace(/&/g, "&&"));
					ExtraMenuData[g_nPos] = ar[i];
					ExtraMenuCommand[g_nPos] = Sync.Label.ExecAdd;
					delete oList[ar[i]];
				}
				api.InsertMenuItem(hMenu, MAXINT, true, mii);
			});
		}
		for (let s in oList) {
			if (nRes) {
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				nRes = 0;
			}
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++g_nPos, s.replace(/&/g, "&&"));
			ExtraMenuData[g_nPos] = s;
			ExtraMenuCommand[g_nPos] = Sync.Label.ExecAdd;
		}
		if (nPos == g_nPos) {
			hMenu = api.sscanf(hParent, "%llx");
			const mii = api.Memory("MENUITEMINFO");
			mii.fMask = MIIM_STATE;
			mii.fState = MFS_DISABLED;
			api.SetMenuItemInfo(hMenu, nIndex, true, mii);
		}
	},

	ExecAdd: function (Ctrl, pt, Name, nVerb) {
		if (!confirmOk()) {
			return;
		}
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			Selected = FV.SelectedItems();
			Sync.Label.AppendItems(Selected, ExtraMenuData[nVerb]);
		}
	},

	ExecRemove: function (Ctrl, pt, Name, nVerb) {
		if (!confirmOk()) {
			return;
		}
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			Selected = FV.SelectedItems();
			Sync.Label.RemoveItems(Selected, ExtraMenuData[nVerb]);
		}
	},

	Append: function (Item, Label) {
		const path = api.GetDisplayNameOf(Item, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
		if (path) {
			let ar = Sync.Label.DB.Get(path).split(/\s*;\s*/);
			const o = {};
			for (let i in ar) {
				o[ar[i]] = 1;
			}
			ar = String(PathUnquoteSpaces(Label) || "").split(/\s*;\s*/);
			for (let i in ar) {
				o[ar[i]] = 1;
			}
			ar = [];
			delete o[""];
			for (let i in o) {
				ar.push(i);
			}
			Sync.Label.Set(path, ar.join(";"));
		}
	},

	AppendItems: function (Items, Label) {
		if (Items) {
			for (let i = 0; i < Items.Count; i++) {
				Sync.Label.Append(Items.Item(i), Label);
			}
		}
	},

	RemoveItems: function (Items, Label) {
		if (Items) {
			for (let i = Items.Count; i-- > 0;) {
				Sync.Label.Remove(Items.Item(i), Label);
			}
		}
	},

	Remove: function (Item, Label) {
		let s = "";
		const path = api.GetDisplayNameOf(Item, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
		if (path) {
			s = Sync.Label.DB.Get(path);
			const arNew = [];
			if (Label) {
				Label = PathUnquoteSpaces(Label);
				let ar = String(s || "").split(/\s*;\s*/);
				const o = {};
				for (let i in ar) {
					o[ar[i]] = 1;
				}
				ar = String(Label || "").split(/\s*;\s*/);
				for (let i in ar) {
					o[ar[i]] = 0;
				}
				for (let i in o) {
					if (o[i]) {
						arNew.push(i);
					}
				}
				if (Label == "*") {
					arNew.length = 0;
				}
			}
			Sync.Label.Set(path, arNew.join(";"));
		}
		return s;
	},

	Set: function (path, s) {
		if (path) {
			Sync.Label.DB.Set(path, s.replace(/[\\?\\*"]|^ +| +$/g, ""));
			Sync.Label.bModified = true;
		}
	},

	Changed: function (path, s, old) {
		let ar = old ? old.split(/\s*;\s*/) : [];
		const o = {};
		let bChanged = false;
		for (let j in ar) {
			o[ar[j]] = 1;
		}
		ar = (s || "").split(/\s*;\s*/);
		for (let j in ar) {
			o[ar[j]] ^= 1;
		}
		for (let j in o) {
			if (o[j]) {
				Sync.Label.Changed[j] = 1;
				Sync.Label.Redraw[GetParentFolderName(path)] = true;
				bChanged = true;
			}
		}
		if (bChanged) {
			clearTimeout(Sync.Label.tid2);
			Sync.Label.tid2 = setTimeout(Sync.Label.Notify, 500);
		}
	},

	Paste: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		if (Sync.Label.IsWritable(FV)) {
			Sync.Label.AppendItems(api.OleGetClipboard(), Sync.Label.LabelPath(FV));
		}
		return S_OK;
	},

	PasteEx: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const Selected = FV.SelectedItems();
		if (!Selected.Count || !Selected.Item(0).IsFolder) {
			return Sync.Label.Paste(FV);
		}
	},

	Save: function () {
		if (Sync.Label.bModified) {
			Sync.Label.DB.Save();
			Sync.Label.bModified = false;
		}
	},

	Notify: function () {
		const cFV = te.Ctrls(CTRL_FV);
		for (let i in cFV) {
			const FV = cFV[i];
			if (FV.hwnd) {
				const path = api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				if (Sync.Label.Redraw[path]) {
					api.InvalidateRect(FV.hwndList || FV.hwndView || FV.hwnd, null, false);
				}
				const s = PathUnquoteSpaces(Sync.Label.LabelPath(FV));
				if (s) {
					let b = false;
					for (let j in Sync.Label.Changed) {
						if (b = api.PathMatchSpec(j, s)) {
							break;
						}
					}
					if (b) {
						FV.Refresh(true);
					}
				}
			}
		}
		Sync.Label.Changed = {};
		Sync.Label.Redraw = {};
		Sync.Label.Save();
	},

	List: function (list, all) {
		let ix = [];
		Sync.Label.DB.ENumCB(function (path, s) {
			const ar = s.split(/\s*;\s*/);
			for (let i in ar) {
				const s = PathQuoteSpaces(ar[i]);
				if (s) {
					ix.push(s);
					ar[i] = s;
				}
			}
			if (all) {
				all[ar.sort(function (a, b) {
					return api.StrCmpLogical(a, b);
				}).join(" ")] = true;
			}
		});
		ix = ix.sort(function (a, b) {
			return api.StrCmpLogical(b, a);
		});
		for (let i = ix.length; i--;) {
			list[ix[i]] = true;
		}
	},

	Enum: function (pid, Ctrl, fncb, SessionId) {
		const Items = api.CreateObject("FolderItems");
		let b, ar;
		const Label = Sync.Label.LabelPath(pid);
		if (Label) {
			const bWC = /[\*\?;]/.test(Label);
			Sync.Label.DB.ENumCB(function (path, s) {
				const ar3 = Label.split(/;/);
				for (k in ar3) {
					const ar2 = api.CommandLineToArgv(ar3[k]);
					b = true;
					ar = null;
					for (let j in ar2) {
						const s2 = ar2[j];
						if (s2 && !api.PathMatchSpec(s2, s)) {
							b = false;
							if (bWC) {
								ar = s.split(/\s*;\s*/);
								for (let i in ar) {
									if (api.PathMatchSpec(ar[i], s2)) {
										b = true;
										break;
									}
								}
							}
							break;
						}
					}
					if (b) {
						break;
					}
				}
				if (b && path != "%Installed%") {
					Items.AddItem(path);
				}
			});
		} else {
			const oList = {};
			Sync.Label.List(oList);
			for (let s in oList) {
				Items.AddItem("label:" + s);
			}
		}
		return Items;
	},

	DoSort: function (Ctrl, pt, strProp) {
		(GetFolderView(Ctrl, pt) || {}).SortColumn = "System.Contact.Label";
		return S_OK;
	},

	Sort: function (Ctrl, Name) {
		if (Sync.Label.tid[Ctrl.Id]) {
			clearTimeout(Sync.Label.tid[Ctrl.Id]);
			delete Sync.Label.tid[Ctrl.Id];
		}
		if (/^\-?System\.Contact\.Label$/i.test(Name)) {
			CustomSort(Ctrl, 'System.Contact.Label', /^\-/.test(Name),
				function (pid, FV) {
					return Sync.Label.DB.Get(api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
				},
				function (a, b) {
					return api.StrCmpLogical(b[1], a[1]);
				}
			);
			return true;
		}
	},

	SetSync: function (name, s) {
		this.SyncItem[name] = s;
		clearTimeout(this.tidSync);
		this.tidSync = setTimeout(function () {
			Sync.Label.tidSync = null;
			Sync.Label.SyncItem = {};
		}, 500);
	}
}

Sync.Label.DB.OnLoad = function () {
	AddEvent("SaveConfig", Sync.Label.Save);
	AddEvent("ChangeNotifyItem:" + Sync.Label.CONFIG, function (pid) {
		if (pid.ModifyDate != te.Data.LabelModifyDate) {
			te.Data.LabelModifyDate = pid.ModifyDate;
			Sync.Label.DB.Load();
			Sync.Label.bModified = false;
		}
	});
}

AddEvent("Layout", function () {
	Sync.Label.DB.Load();
	Sync.Label.bModified = false;
	if (Sync.Label.DB.OnLoad) {
		Sync.Label.DB.OnLoad();
	}
	te.Labels = Sync.Label.DB.DB;
	Sync.Label.DB.OnChange = Sync.Label.Changed;
	const Installed0 = Sync.Label.DB.Get('%Installed%').toUpperCase();
	const Installed1 = Sync.Label.Portable ? fso.GetDriveName(api.GetModuleFileName(null)).toUpperCase() : "";
	if (Installed0 && Sync.Label.Portable && Installed0 != Installed1) {
		Sync.Label.DB.ENumCB(function (path, label) {
			const drv = fso.GetDriveName(path);
			if (drv.toUpperCase() == Installed0) {
				Sync.Label.Set(path, "");
				Sync.Label.Set(Installed1 + path.substr(drv.length), label);
			}
		});
	}
	if (Sync.Label.Portable || Installed0) {
		Sync.Label.Set('%Installed%', Installed1);
	}
});


AddEvent("TranslatePath", function (Ctrl, Path) {
	if (Sync.Label.IsHandle(Path)) {
		Ctrl.Enum = Sync.Label.Enum;
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("GetFolderItemName", function (pid) {
	const Label = Sync.Label.LabelPath(pid);
	if (Label) {
		return "label:" + Label;
	}
}, true);

AddEvent("GetIconImage", function (Ctrl, clBk, bSimple) {
	if (Sync.Label.IsHandle(Ctrl)) {
		return MakeImgDataEx(Sync.Label.Icon, bSimple, 16, clBk);
	}
});

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (Ctrl.Type <= CTRL_EB) {
		if ((wParam & 0xfff) == CommandID_DELETE - 1) {
			if (Sync.Label.IsHandle(Ctrl)) {
				Sync.Label.ExecRemoveItems(Ctrl);
				return S_OK;
			}
		}
		if ((wParam & 0xfff) == CommandID_PASTE - 1) {
			if (Sync.Label.IsHandle(Ctrl)) {
				return Sync.Label.Paste(Ctrl);
			}
		}
	}
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	if (Verb == CommandID_DELETE - 1) {
		const FV = ContextMenu.FolderView;
		if (FV && Sync.Label.IsHandle(FV)) {
			return S_OK;
		}
	}
	if (Verb == CommandID_PASTE - 1) {
		const FV = ContextMenu.FolderView;
		if (FV && Sync.Label.IsHandle(FV)) {
			return Sync.Label.PasteEx(Ctrl);
		}
	}
	if (!Verb || Verb == CommandID_STORE - 1) {
		if (ContextMenu.Items.Count >= 1) {
			const path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
			if (Sync.Label.IsHandle(path)) {
				const FV = te.Ctrl(CTRL_FV);
				FV.Navigate(path, SBSP_SAMEBROWSER);
				return S_OK;
			}
		}
	}
}, true);

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Sync.Label.IsWritable(Ctrl)) {
		return S_OK;
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Sync.Label.IsWritable(Ctrl)) {
		if (Ctrl.Type == CTRL_DT || Ctrl.HitTest(pt, LVHT_ONITEM) < 0) {
			pdwEffect[0] = DROPEFFECT_LINK;
			return S_OK;
		}
	}
}, true);

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	const Label = Sync.Label.LabelPath(Ctrl);
	if (Sync.Label.IsWritable(Ctrl)) {
		let nIndex = -1;
		if (Ctrl.Type <= CTRL_EB) {
			nIndex = Ctrl.HitTest(pt, LVHT_ONITEM);
		} else if (Ctrl.Type != CTRL_DT) {
			return S_OK;
		}
		if (nIndex < 0) {
			Sync.Label.AppendItems(dataObj, Label);
		}
		return S_OK;
	}
}, true);

AddEvent("DragLeave", function (Ctrl) {
	return S_OK;
});

AddEvent("Menus", function (Ctrl, hMenu, nPos, Selected, SelItem, ContextMenu, Name, pt) {
	if (/Background|Edit/i.test(Name)) {
		if (Sync.Label.IsWritable(GetFolderView(Ctrl, pt))) {
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
							ExtraMenuCommand[mii.wID] = Sync.Label.Paste;
						}
					}
				}
			}
		}
	}
	return nPos;
});

AddEvent("ChangeNotify", function (Ctrl, pidls) {
	if (te.Labels) {
		if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
			let name = GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			let s = Sync.Label.Remove(pidls[0]);
			if (s) {
				Sync.Label.SetSync(name, s);
			} else {
				name = GetFileName(api.GetDisplayNameOf(pidls[1], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
				s = Sync.Label.SyncItem[name];
			}
			if (s) {
				Sync.Label.Append(pidls[1], s);
			}
		}
		if (pidls.lEvent & (SHCNE_DELETE | SHCNE_RMDIR)) {
			const name = GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			Sync.Label.SetSync(name, Sync.Label.Remove(pidls[0]));
		}
		if (pidls.lEvent & (SHCNE_CREATE | SHCNE_MKDIR)) {
			const name = GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			const Item = Sync.Label.SyncItem[name];
			if (Item) {
				Sync.Label.Append(pidls[0], Item);
			}
		}
	}
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	if (Sync.Label.IsHandle(Ctrl)) {
		RemoveCommand(hMenu, ContextMenu, "delete;rename");
		api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
		ExtraMenuCommand[nPos] = OpenContains;
		if (Sync.Label.IsWritable(Ctrl)) {
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText('Remove'));
			ExtraMenuCommand[nPos] = Sync.Label.ExecRemoveItems;
		}
	}
	return nPos;
});

AddEvent("BeginLabelEdit", function (Ctrl, Name) {
	if (Ctrl.Type <= CTRL_EB) {
		if (Sync.Label.IsHandle(Ctrl)) {
			return 1;
		}
	}
}, true);

AddEvent("ColumnClick", function (Ctrl, iItem) {
	const cColumns = api.CommandLineToArgv(Ctrl.Columns(1));
	if (cColumns[iItem * 2] == "System.Contact.Label") {
		Ctrl.SortColumn = (Ctrl.SortColumn != 'System.Contact.Label') ? 'System.Contact.Label' : '-System.Contact.Label';
		return S_OK;
	}
});

AddEvent("Sort", function (Ctrl) {
	if (Sync.Label.tid[Ctrl.Id]) {
		clearTimeout(Sync.Label.tid[Ctrl.Id]);
		delete Sync.Label.tid[Ctrl.Id];
	}
	if (/\-?System\.Contact\.Label;$/.exec(Ctrl.GetSortColumn(1))) {
		Sync.Label.tid[Ctrl.Id] = setTimeout(function () {
			Sync.Label.Sort(Ctrl, Ctrl.GetSortColumn(1));
		}, 99);
	}
});

AddEvent("Sorting", Sync.Label.Sort);

AddEvent("FilterChanged", function (Ctrl) {
	const res = /^\*?label:.+/i.exec(Ctrl.FilterView);
	if (res) {
		Ctrl.OnIncludeObject = function (Ctrl, Path1, Path2, Item) {
			const res = /^(\*)?label:\s*(.*)/i.exec(Ctrl.FilterView);
			if (res) {
				let s = res[2];
				if (res[1]) {
					s = s.substr(0, s.length - 1);
				}
				const ar = Sync.Label.DB.Get(Item.Path).split(";");
				for (let i in ar) {
					if (PathMatchEx(ar[i], s)) {
						return S_OK;
					}
				}
				return S_FALSE;
			}
		}
		return S_OK;
	}
});

Sync.Label.strName = GetText(item.getAttribute("MenuName") || api.PSGetDisplayName("System.Contact.Label"));
//Menu
if (item.getAttribute("MenuExec")) {
	Sync.Label.nPos = GetNum(item.getAttribute("MenuPos"));
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		if (item && item.IsFileSystem) {
			const mii = api.Memory("MENUITEMINFO");
			mii.fMask = MIIM_STRING | MIIM_SUBMENU;
			mii.hSubMenu = api.CreatePopupMenu();
			mii.dwTypeData = Sync.Label.strName;
			if (Selected && Selected.Count) {
				const path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				if (path) {
					const ar = [GetText("&Edit")];
					const s = Sync.Label.DB.Get(path);
					if (s) {
						ar.push(s.replace(/&/g, "&&"));
					}
					api.InsertMenu(mii.hSubMenu, 0, MF_BYPOSITION | MF_STRING, ++nPos, ar.join(' - '));
					ExtraMenuCommand[nPos] = Sync.Label.Edit;

					if (s && Selected.Count == 1) {
						api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Path"));
						ExtraMenuCommand[nPos] = Sync.Label.EditPath;
					}
				}
			}
			if (Ctrl.CurrentViewMode == FVM_DETAILS) {
				if (!/"System\.Contact\.Label"/.test(Ctrl.Columns(1))) {
					api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Details"));
					ExtraMenuCommand[nPos] = Sync.Label.Details;
				}
			}
			if (WINVER >= 0x600) {
				api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 50690) + api.PSGetDisplayName("System.Contact.Label"));
				ExtraMenuCommand[nPos] = Sync.Label.DoSort;
			}
			const mii2 = api.Memory("MENUITEMINFO");
			mii2.fMask = MIIM_STRING | MIIM_SUBMENU;
			mii2.hSubMenu = api.CreatePopupMenu();
			mii2.dwTypeData = GetText("Add");
			api.InsertMenu(mii2.hSubMenu, 0, MF_BYPOSITION | MF_STRING, 0, api.sprintf(99, '\tJScript\tSync.Label.AddMenu("%llx", "%llx", %d)', mii2.hSubMenu, mii.hSubMenu, 1));
			api.InsertMenuItem(mii.hSubMenu, MAXINT, true, mii2);

			mii2.fMask = MIIM_STRING | MIIM_SUBMENU | MIIM_STATE;
			mii2.fState = MFS_DISABLED;
			mii2.hSubMenu = api.CreatePopupMenu();
			mii2.dwTypeData = GetText("Remove");
			const o = {};
			for (let i = Selected.Count; i-- > 0;) {
				const path = api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				if (path) {
					const ar = Sync.Label.DB.Get(path).split(/\s*;\s*/);
					for (let j in ar) {
						o[ar[j]] = 1;
					}
				}
			}
			delete o[""];
			for (let s in o) {
				api.InsertMenu(mii2.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, s.replace(/&/g, "&&"));
				mii2.fState = MFS_ENABLED;
				ExtraMenuData[nPos] = s;
				ExtraMenuCommand[nPos] = Sync.Label.ExecRemove;
			}
			api.InsertMenuItem(mii.hSubMenu, MAXINT, true, mii2);

			api.InsertMenuItem(hMenu, Sync.Label.nPos, true, mii);
		}
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.Label.Edit, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.Label.Edit, "Func");
}
AddTypeEx("Add-ons", "Label", Sync.Label.Edit);
