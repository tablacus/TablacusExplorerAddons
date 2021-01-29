const Addon_Id = "badge";
const item = GetAddonElement(Addon_Id);

Sync.Badge = {
	RE: /badge:(.*)/i,
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),
	Changed: {},
	Redraw: {},
	nPosAdd: 0,
	nPosDel: 0,
	tid2: null,
	tidSync: null,
	SyncItem: {},
	Initd: false,
	Portable: GetNum(item.getAttribute("Portable")),
	Bottom: GetNum(item.getAttribute("Bottom")),
	Image: [],
	tid: {},

	IsHandle: function (Ctrl) {
		return Sync.Badge.RE.exec("string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
	},

	SetX: function (Ctrl, pt, s) {
		const Selected = GetSelectedArray(Ctrl, pt, true).shift();
		if (Selected && Selected.Count) {
			for (let i = Selected.Count; i-- > 0;) {
				Sync.Badge.Set(api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL), s);
			}
		}
	},

	Set0: function (Ctrl, pt) {
		Sync.Badge.SetX(Ctrl, pt, 0);
	},

	Set1: function (Ctrl, pt) {
		Sync.Badge.SetX(Ctrl, pt, 1);
	},

	Set2: function (Ctrl, pt) {
		Sync.Badge.SetX(Ctrl, pt, 2);
	},

	Set3: function (Ctrl, pt) {
		Sync.Badge.SetX(Ctrl, pt, 3);
	},

	Set4: function (Ctrl, pt) {
		Sync.Badge.SetX(Ctrl, pt, 4);
	},

	Set5: function (Ctrl, pt) {
		Sync.Badge.SetX(Ctrl, pt, 5);
	},

	Open0: function (Ctrl, pt) {
		Navigate("badge:*");
	},

	Open1: function (Ctrl, pt) {
		Navigate("badge:1");
	},

	Open2: function (Ctrl, pt) {
		Navigate("badge:2");
	},

	Open3: function (Ctrl, pt) {
		Navigate("badge:3");
	},

	Open4: function (Ctrl, pt) {
		Navigate("badge:4");
	},

	Open5: function (Ctrl, pt) {
		Navigate("badge:5");
	},

	Enum: function (pid, Ctrl, fncb, SessionId) {
		const Items = te.FolderItems();
		const Badge = Sync.Badge.BadgePath(pid);
		Sync.Badge.DB.ENumCB(function (path, s) {
			const parent = GetParentFolderName(path);
			if (api.PathMatchSpec(Badge, s) || api.PathMatchSpec(parent, Badge)) {
				Items.AddItem(path);
			}
		});
		return Items;
	},

	EditPath: function (Ctrl, pt) {
		const Selected = GetSelectedArray(Ctrl, pt, true).shift();
		if (Selected && Selected.Count == 1) {
			try {
				const path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				if (path) {
					const Badge = Sync.Badge.DB.Get(path);
					InputDialog("badge:" + Badge + "\n" + path, path, function (s) {
						if ("string" === typeof s) {
							api.SHParseDisplayName(function (pid, s, path, Badge) {
								if (pid) {
									s = api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
								}
								if (s != path) {
									if (Sync.Badge.DB.Get(s)) {
										wsh.Popup(api.LoadString(hShell32, 6327));
									} else {
										Sync.Badge.Set(s, Badge);
										Sync.Badge.Set(path, "");
									}
								}
							}, 0, s, s, path, Badge);
						}
					});
				}
			} catch (e) {
				wsh.Popup(e.message + "\n" + s, 0, TITLE, MB_ICONSTOP);
			}
		}
	},

	ExecRemoveItems: function (Ctrl, pt) {
		if (!confirmOk()) {
			return;
		}
		const ar = GetSelectedArray(Ctrl, pt);
		const Selected = ar.shift();
		const SelItem = ar.shift();
		const FV = ar.shift();
		const Badge = Sync.Badge.BadgePath(FV);
		if (Badge) {
			Sync.Badge.RemoveItems(Selected, Badge);
		}
	},

	BadgePath: function (Ctrl) {
		const res = Sync.Badge.IsHandle(Ctrl);
		if (res) {
			return res[1];
		}
	},

	ExecAdd: function (Ctrl, pt, Name, nVerb) {
		if (!confirmOk()) {
			return;
		}
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			Selected = FV.SelectedItems();
			Sync.Badge.AppendItems(Selected, ExtraMenuData[nVerb]);
		}
	},

	ExecRemove: function (Ctrl, pt, Name, nVerb) {
		if (!confirmOk()) {
			return;
		}
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			Selected = FV.SelectedItems();
			Sync.Badge.RemoveItems(Selected, ExtraMenuData[nVerb]);
		}
	},

	AppendItems: function (Items, Badge) {
		if (Items) {
			for (let i = 0; i < Items.Count; i++) {
				Sync.Badge.Set(Items.Item(i), Badge);
			}
		}
	},

	RemoveItems: function (Items) {
		if (Items) {
			for (let i = Items.Count; i-- > 0;) {
				Sync.Badge.Remove(Items.Item(i));
			}
		}
	},

	Remove: function (Item) {
		let s = "";
		const path = api.GetDisplayNameOf(Item, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
		if (path) {
			s = Sync.Badge.DB.Get(path);
			Sync.Badge.Set(path, 0);
		}
		return s;
	},

	Set: function (path, s) {
		if (path) {
			if ("string" !== typeof path) {
				path = api.GetDisplayNameOf(path, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
			}
			Sync.Badge.DB.Set(path, GetNum(s));
		}
	},

	Paste: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const Badge = Sync.Badge.BadgePath(FV);
		if (GetNum(Badge)) {
			Sync.Badge.AppendItems(api.OleGetClipboard(), Badge);
		}
		return S_OK;
	},

	PasteEx: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const Selected = FV.SelectedItems();
		if (!Selected.Count || !Selected.Item(0).IsFolder) {
			return Sync.Badge.Paste(FV);
		}
	},


	Notify: function () {
		const cFV = te.Ctrls(CTRL_FV);
		for (let i in cFV) {
			const FV = cFV[i];
			if (FV.hwnd) {
				const path = api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				if (Sync.Badge.Redraw[path]) {
					api.InvalidateRect(FV.hwndList || FV.hwndView || FV.hwnd, null, false);
				}
				const s = Sync.Badge.BadgePath(FV);
				if (s) {
					let b = false;
					for (let j in Sync.Badge.Changed) {
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
		Sync.Badge.Changed = {};
		Sync.Badge.Redraw = {};
		Sync.Badge.DB.Save();
	},

	List: function (list) {
		let ix = [];
		Sync.Badge.DB.ENumCB(function (path, s) {
			if (s) {
				ix.push(s);
			}
		});
		ix = ix.sort(function (a, b) {
			return api.StrCmpLogical(b, a)
		});
		for (let i = ix.length; i--;) {
			list[ix[i]] = true;
		}
	},

	SetSort: function (Ctrl, pt) {
		(GetFolderView(Ctrl, pt) || {}).SortColumn = "Tablacus.Badge";
		return S_OK;
	},

	SetSync: function (name, s) {
		this.SyncItem[name] = s;
		clearTimeout(this.tidSync);
		this.tidSync = setTimeout(function () {
			Sync.Badge.tidSync = null;
			Sync.Badge.SyncItem = {};
		}, 500);
	},

	Sort: function (Ctrl, Name) {
		if (Sync.Badge.tid[Ctrl.Id]) {
			clearTimeout(Sync.Badge.tid[Ctrl.Id]);
			delete Sync.Badge.tid[Ctrl.Id];
		}
		if (/\-?Tablacus\.Badge$/i.test(Name)) {
			CustomSort(Ctrl, Sync.Badge.strName, /^\-/.test(Name),
				function (pid, FV) {
					return Sync.Badge.DB.Get(api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
				},
				function (a, b) {
					return api.StrCmpLogical(b[1], a[1]);
				}
			);
			return true;
		}
	}
}

AddEvent("Load", function () {
	Sync.Badge.DB = new SimpleDB("badge");
	Sync.Badge.DB.Load();
	Sync.Badge.DB.OnChange = function (n, s, old) {
		clearTimeout(Sync.Badge.tid2);
		Sync.Badge.tid2 = setTimeout(Sync.Badge.Notify, 500);
		Sync.Badge.Redraw[GetParentFolderName(n)] = true;
		Sync.Badge.Changed[s] = true;
		Sync.Badge.Changed[old] = true;
	}
	AddEvent("SaveConfig", Sync.Badge.DB.Save);
	AddEvent("Finalize", Sync.Badge.DB.Close);

	const Installed0 = Sync.Badge.DB.Get('%Installed%').toUpperCase();
	const Installed1 = Sync.Badge.Portable ? fso.GetDriveName(api.GetModuleFileName(null)).toUpperCase() : "";
	if (Installed0 && Sync.Badge.Portable && Installed0 != Installed1) {
		Sync.Badge.DB.ENumCB(function (path, badge) {
			const drv = fso.GetDriveName(path);
			if (drv.toUpperCase() == Installed0) {
				Sync.Badge.Set(path, "");
				Sync.Badge.Set(Installed1 + path.substr(drv.length), badge);
			}
		});
	}
	if (Sync.Badge.Portable || Installed0) {
		Sync.Badge.Set('%Installed%', Installed1);
	}
});

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (Sync.Badge.IsHandle(Path)) {
		Ctrl.Enum = Sync.Badge.Enum;
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("GetFolderItemName", function (pid) {
	const Badge = Sync.Badge.BadgePath(pid);
	if (Badge) {
		return "badge:" + Badge;
	}
}, true);

AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple) {
	if (Sync.Badge.IsHandle(Ctrl)) {
		return MakeImgDataEx("bitmap:ieframe.dll,699,16,28", bSimple, 16);
	}
});

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
		if ((wParam & 0xfff) == CommandID_DELETE - 1) {
			if (Sync.Badge.IsHandle(Ctrl)) {
				Sync.Badge.ExecRemoveItems(Ctrl);
				return S_OK;
			}
		}
		if ((wParam & 0xfff) == CommandID_PASTE - 1) {
			if (Sync.Badge.IsHandle(Ctrl)) {
				return Sync.Badge.Paste(Ctrl);
			}
		}
	}
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	if (Verb == CommandID_DELETE - 1) {
		const FV = ContextMenu.FolderView;
		if (FV && Sync.Badge.IsHandle(FV)) {
			return S_OK;
		}
	}
	if (Verb == CommandID_PASTE - 1) {
		const FV = ContextMenu.FolderView;
		if (FV && Sync.Badge.IsHandle(FV)) {
			return Sync.Badge.PasteEx(Ctrl);
		}
	}
	if (!Verb || Verb == CommandID_STORE - 1) {
		if (ContextMenu.Items.Count >= 1) {
			const path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
			if (Sync.Badge.IsHandle(path)) {
				const FV = te.Ctrl(CTRL_FV);
				FV.Navigate(path, SBSP_SAMEBROWSER);
				return S_OK;
			}
		}
	}
}, true);

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
		const Badge = Sync.Badge.BadgePath(Ctrl);
		if (GetNum(Badge)) {
			return S_OK;
		}
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type <= CTRL_EB) {
		const Badge = Sync.Badge.BadgePath(Ctrl);
		if (GetNum(Badge)) {
			if (Ctrl.HitTest(pt, LVHT_ONITEM) < 0) {
				pdwEffect[0] = DROPEFFECT_LINK;
				return S_OK;
			}
		}
	}
	if (Ctrl.Type == CTRL_DT) {
		const Badge = Sync.Badge.BadgePath(Ctrl);
		if (GetNum(Badge)) {
			pdwEffect[0] = DROPEFFECT_LINK;
			return S_OK;
		}
	}
}, true);

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	const Badge = Sync.Badge.BadgePath(Ctrl);
	if (GetNum(Badge)) {
		let nIndex = -1;
		if (Ctrl.Type <= CTRL_EB) {
			nIndex = Ctrl.HitTest(pt, LVHT_ONITEM);
		} else if (Ctrl.Type != CTRL_DT) {
			return S_OK;
		}
		if (nIndex < 0) {
			Sync.Badge.AppendItems(dataObj, Badge);
		}
		return S_OK;
	}
}, true);

AddEvent("DragLeave", function (Ctrl) {
	return S_OK;
});

AddEvent("Menus", function (Ctrl, hMenu, nPos, Selected, SelItem, ContextMenu, Name, pt) {
	if (/Background|Edit/i.test(Name)) {
		const Badge = Sync.Badge.BadgePath(GetFolderView(Ctrl, pt));
		if (GetNum(Badge)) {
			const Items = api.OleGetClipboard();
			if (Items && Items.Count) {
				const mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_ID | MIIM_STATE;
				const paste = api.LoadString(hShell32, 33562) || "&Paste";
				for (let i = api.GetMenuItemCount(hMenu); i-- > 0;) {
					api.GetMenuItemInfo(hMenu, i, true, mii);
					if (mii.fState & MFS_DISABLED) {
						const s = api.GetMenuString(hMenu, i, MF_BYPOSITION);
						if (s && s.indexOf(paste) == 0) {
							api.EnableMenuItem(hMenu, i, MF_ENABLED | MF_BYPOSITION);
							ExtraMenuCommand[mii.wID] = Sync.Badge.Paste;
						}
					}
				}
			}
		}
	}
	return nPos;
});

AddEvent("ChangeNotify", function (Ctrl, pidls) {
	if (Sync.Badge.DB) {
		if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
			let name = GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			let s = Sync.Badge.Remove(pidls[0]);
			if (s) {
				Sync.Badge.SetSync(name, s);
			} else {
				name = GetFileName(api.GetDisplayNameOf(pidls[1], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
				s = Sync.Badge.SyncItem[name];
			}
			if (s) {
				Sync.Badge.Set(pidls[1], s);
			}
		}
		if (pidls.lEvent & (SHCNE_DELETE | SHCNE_RMDIR)) {
			const name = GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			Sync.Badge.SetSync(name, Sync.Badge.Remove(pidls[0]));
		}
		if (pidls.lEvent & (SHCNE_CREATE | SHCNE_MKDIR)) {
			const name = GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			const Item = Sync.Badge.SyncItem[name];
			if (Item) {
				Sync.Badge.Set(pidls[0], Item);
			}
		}
	}
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	if (Sync.Badge.IsHandle(Ctrl)) {
		RemoveCommand(hMenu, ContextMenu, "delete;rename");
		api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
		ExtraMenuCommand[nPos] = OpenContains;
		api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText('Remove'));
		ExtraMenuCommand[nPos] = Sync.Badge.ExecRemoveItems;
	}
	return nPos;
});

AddEvent("BeginLabelEdit", function (Ctrl, Name) {
	if (Ctrl.Type <= CTRL_EB) {
		if (Sync.Badge.IsHandle(Ctrl)) {
			return 1;
		}
	}
}, true);

AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd) {
	const hList = Ctrl.hwndList;
	if (hList && pid && Sync.Badge.DB) {
		let image = Sync.Badge.Image[Sync.Badge.DB.Get(pid.Path)];
		if (image) {
			const rc = api.Memory("RECT");
			rc.left = LVIR_ICON;
			api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
			if (api.SendMessage(hList, LVM_GETVIEW, 0, 0) == 1) {
				rc.right = Math.min(rc.right, api.SendMessage(hList, LVM_GETCOLUMNWIDTH, 0, 0));
			}
			image = GetThumbnail(image, (rc.bottom - rc.top) / 2, true);
			if (image) {
				image.DrawEx(nmcd.hdc, rc.right - image.GetWidth(), Sync.Badge.Bottom ? rc.bottom - image.GetHeight() : rc.top, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
			}
		}
	}
});

AddEvent("FilterChanged", function (Ctrl) {
	let res = /^\*?badge:[^*]+/i.exec(Ctrl.FilterView);
	if (res) {
		Ctrl.OnIncludeObject = function (Ctrl, Path1, Path2, Item) {
			res = /^\*?badge:\s*([<=>]*)(\d+)/i.exec(Ctrl.FilterView);
			if (res) {
				switch (res[1]) {
					case '<':
						return (Sync.Badge.DB.Get(Item.Path) || 0) < res[2] ? S_OK : S_FALSE;
					case '>':
						return (Sync.Badge.DB.Get(Item.Path) || 0) > res[2] ? S_OK : S_FALSE;
					case '<=':
						return (Sync.Badge.DB.Get(Item.Path) || 0) <= res[2] ? S_OK : S_FALSE;
					case '>=':
						return (Sync.Badge.DB.Get(Item.Path) || 0) >= res[2] ? S_OK : S_FALSE;
					default:
						return (Sync.Badge.DB.Get(Item.Path) || 0) == res[2] ? S_OK : S_FALSE;
				}
			}
		}
		return S_OK;
	}
});

AddEvent("Sort", function (Ctrl) {
	if (Sync.Badge.tid[Ctrl.Id]) {
		clearTimeout(Sync.Badge.tid[Ctrl.Id]);
		delete Sync.Badge.tid[Ctrl.Id];
	}
	if (/\-?Tablacus\.Badge$/i.test(Ctrl.GetSortColumn(1))) {
		Sync.Badge.tid[Ctrl.Id] = setTimeout(function () {
			Sync.Badge.Sort(Ctrl, Ctrl.GetSortColumn(1));
		}, 99);
	}
});

AddEvent("Sorting", Sync.Badge.Sort);

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		if (item && item.IsFileSystem) {
			const mii = api.Memory("MENUITEMINFO");
			mii.cbSize = mii.Size;
			mii.fMask = MIIM_STRING | MIIM_SUBMENU;
			mii.hSubMenu = api.CreatePopupMenu();
			mii.dwTypeData = Sync.Badge.strName;
			if (Selected && Selected.Count) {
				const path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				if (path) {
					const mii2 = api.Memory("MENUITEMINFO");
					mii2.cbSize = mii.Size;
					mii2.fMask = MIIM_STRING | MIIM_SUBMENU;
					mii2.hSubMenu = api.CreatePopupMenu();
					mii2.dwTypeData = api.LoadString(hShell32, 12850);
					const s = Sync.Badge.DB.Get(path);
					const str1 = unescape('\%u2605%u2605%u2605%u2605%u2605%u2606%u2606%u2606%u2606%u2606%u2606');
					for (let i = 6; i--;) {
						api.InsertMenu(mii.hSubMenu, 0, MF_BYPOSITION | MF_STRING | (s == i ? MF_CHECKED : 0), ++nPos, ["&" + i, " - ", str1.substr(5 - i, 5)].join(""));
						ExtraMenuCommand[nPos] = Sync.Badge["Set" + i];
						api.InsertMenu(mii2.hSubMenu, 0, MF_BYPOSITION | MF_STRING, ++nPos, i ? ["&" + i, " - ", str1.substr(5 - i, 5)].join("") : GetText("All"));
						ExtraMenuCommand[nPos] = Sync.Badge["Open" + i];
					}
					api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
					api.InsertMenuItem(mii.hSubMenu, MAXINT, true, mii2);
					api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
					if (s && Selected.Count == 1) {
						api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Path"));
						ExtraMenuCommand[nPos] = Sync.Badge.EditPath;
					}
				}
			}

			if (WINVER >= 0x600) {
				api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 50690) + Sync.Badge.strName);
				ExtraMenuCommand[nPos] = Sync.Badge.SetSort;
			}

			api.InsertMenuItem(hMenu, Sync.Badge.nPos, true, mii);
		}
		return nPos;
	});
}
//Image
let hdc, hFont, s;
for (let i = 6; --i;) {
	const image = api.CreateObject("WICBitmap");
	if (s = ExtractPath(te, item.getAttribute("Img" + i))) {
		Sync.Badge.Image[i] = image.FromFile(s);
		if (Sync.Badge.Image[i]) {
			continue;
		}
	}
	if (!hdc) {
		hdc = api.GetDC(te.hwnd);
	}
	const rc = api.Memory("RECT");
	const w = 32 * screen.deviceYDPI / 96;
	rc.right = w;
	rc.bottom = w;
	const hbm = api.CreateCompatibleBitmap(hdc, w, w);
	const hmdc = api.CreateCompatibleDC(hdc);
	const hOld = api.SelectObject(hmdc, hbm);
	const brush = api.CreateSolidBrush(159 + i * 16);
	api.FillRect(hmdc, rc, brush);
	api.DeleteObject(brush);
	api.SetTextColor(hmdc, 0xffffff);
	api.SetBkMode(hmdc, 1);
	if (!hFont) {
		const lf = api.Memory("LOGFONT");
		lf.lfFaceName = "Arial Black",
		lf.lfHeight = -w;
		lf.lfWeight = 700;
		hFont = CreateFont(lf);
	}
	const hfontOld = api.SelectObject(hmdc, hFont);
	rc.top = -w / 4;
	api.DrawText(hmdc, i, -1, rc, DT_CENTER);
	api.SelectObject(hmdc, hfontOld);
	api.SelectObject(hmdc, hOld);
	api.DeleteDC(hmdc);
	Sync.Badge.Image[i] = image.FromHBITMAP(hbm);
	api.DeleteObject(hbm);
}
if (hdc) {
	api.ReleaseDC(te.hwnd, hdc);
}
