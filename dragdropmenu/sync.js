const Addon_Id = "dragdropmenu";

Sync.DragDropMenu = {
	xml: OpenXml(Addon_Id + g_.bit + ".xml", false, true),

	FO: function (Ctrl, Items, Dest, grfKeyState, pt, pdwEffect, nMode) {
		if (!(grfKeyState & MK_RBUTTON) || Items.Count == 0) {
			return false;
		}
		const items = Sync.DragDropMenu.xml.getElementsByTagName("Item");
		const IdFO = {}, cmdFO = {};
		const ContextMenus = [];
		const hMenu = api.CreatePopupMenu();
		let wID = 1;
		for (let i = 0; i < items.length; ++i) {
			const item = items[i];
			const cls = item.getAttribute("Class");
			const Flags = GetNum(item.getAttribute("Flags"));
			const Filter = item.getAttribute("Filter") || "*";
			if (Filter != "*") {
				if (!PathMatchEx(Dest.Path, Filter)) {
					continue;
				}
			}
			if (Flags & 2) {
				if (api.PathIsNetworkPath(Dest.Path)) {
					continue;
				}
				let d = {};
				const drv = fso.GetDriveName(Dest.Path);
				if (drv) {
					try {
						d = fso.GetDrive(drv);
					} catch (e) { }
				}
				if (!/NTFS/i.test(d.FileSystem)) {
					continue;
				}
			}
			const nCount = api.GetMenuItemCount(hMenu);
			if (/^{/.test(cls)) {
				const dll = ExtractPath(te, item.getAttribute("Path"));
				const ContextMenu = api.ContextMenu(dll, cls, Dest, Items, HKEY_CLASSES_ROOT, item.getAttribute("Options"), null);
				if (ContextMenu) {
					ContextMenu.QueryContextMenu(hMenu, nCount, wID, wID + 0xFF, CMF_NORMAL);
					ContextMenus.push(ContextMenu);
					wID = ContextMenu.idCmdLast + 1;
				}
				continue;
			}
			if (SameText(cls, "separator")) {
				api.InsertMenu(hMenu, nCount, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				continue;
			}
			if (SameText(cls, "copy")) {
				IdFO[wID] = DROPEFFECT_COPY;
			}
			if (SameText(cls, "move")) {
				IdFO[wID] = DROPEFFECT_MOVE;
			}
			if (SameText(cls, "shortcut")) {
				IdFO[wID] = DROPEFFECT_LINK;
			}
			if (SameText(cls, "exec")) {
				const path = ExtractPath(te, item.getAttribute("Path"));
				if (!fso.FileExists(path)) {
					continue;
				}
				cmdFO[wID] = {
					Path: path,
					Options: item.getAttribute("Options"),
					Flags: Flags
				};
			}
			api.InsertMenu(hMenu, nCount, MF_BYPOSITION | MF_STRING, wID++, item.getAttribute("Name"));
		}
		ExtraMenuCommand = api.CreateObject("Object");
		ExtraMenuData = api.CreateObject("Object");
		eventTE.menucommand = api.CreateObject("Array");
		eventTA.menucommand = api.CreateObject("Array");
		let i = api.GetMenuItemCount(hMenu);
		if (eventTE.menus.dragdrop) {
			i = eventTE.menus.dragdrop(Ctrl, hMenu, g_nPos, Items, Dest, ContextMenus, "DragDrop", pt);
		}
		if (i) {
			const mii = api.Memory("MENUITEMINFO");
			mii.fMask = MIIM_FTYPE;
			let fType = MFT_SEPARATOR;
			while (--i >= 0) {
				if (i == 0) {
					fType = MFT_SEPARATOR;
				}
				api.GetMenuItemInfo(hMenu, i, true, mii);
				if (fType & mii.fType & MFT_SEPARATOR) {
					api.DeleteMenu(hMenu, i, MF_BYPOSITION);
				}
				fType = mii.fType;
			}
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 0, GetText("Cancel"));
			const nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenus);
			if (IdFO[nVerb]) {
				const DropTarget = api.DropTarget(Dest);
				const pdwEffect = [IdFO[nVerb]];
				DropTarget.Drop(Items, MK_LBUTTON, pt, pdwEffect);
			} else if (cmdFO[nVerb]) {
				const cmd = cmdFO[nVerb];
				const wfd = api.Memory("WIN32_FIND_DATA");
				let s = cmd.Options;
				if (cmd.Flags & 8) {
					const strTemp = GetTempPath(4);
					let strTemp2;
					const Items2 = api.CreateObject("FolderItems");
					for (let i = 0; i < Items.Count; ++i) {
						let path1 = Items.Item(i).Path;
						const hFind = api.FindFirstFile(path1, wfd);
						if (hFind != INVALID_HANDLE_VALUE) {
							api.FindClose(hFind);
							if (!api.StrCmpNI(path1, strTemp, strTemp.length)) {
								if (!strTemp2) {
									strTemp2 = GetTempPath(7);
									CreateFolder(strTemp2);
								}
								if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
									fso.MoveFolder(path1, strTemp2);
								} else {
									fso.MoveFile(path1, strTemp2);
								}
								path1 = strTemp2 + GetFileName(path1);
							}
						}
						Items2.AddItem(path1);
					}
					Items = Items2;
				}
				if (/%each%/i.test(s)) {
					for (let i = 0; i < Items.Count; ++i) {
						let path = Items.Item(i).Path;
						if (!Sync.DragDropMenu.IsFileSystem(path, wfd)) {
							continue;
						}
						const s1 = ExtractMacro(te, s.replace(/%each%/ig, path).replace(/%dest%/ig, Dest.Path).replace(/%IsFolder:(.*?)%/ig, function (strMatch, ref) {
							return IsFolderEx(Items.Item(i)) ? ref : "";
						}).replace(/%name%/ig, function (strMatch, ref) {
							return GetFileName(path) || path.charAt(0);
						}).replace(/%unique%/ig, function (strMatch, ref) {
							let base = path;
							let ext = "";
							const res = /^(.*)(\.[^\.]*)$/.exec(base);
							if (base && !IsFolderEx(Items.Item(i))) {
								base = res[1];
								ext = res[2];
							}
							base = BuildPath(Dest.Path, GetFileName(base) || base.charAt(0));
							let result = base + ext;
							let n = 0;
							while (Sync.DragDropMenu.IsFileSystem(result, wfd)) {
								result = base + " (" + (++n) + ")" + ext;
							}
							return result;
						}));
						ShellExecute(PathQuoteSpaces(cmd.Path) + " " + s1, (cmd.Flags & 2) ? "RunAs" : null, (cmd.Flags & 4) ? SW_HIDE : SW_SHOWNORMAL);
					}
				} else if (/%src%/i.test(s)) {
					const ar = [];
					for (let i = Items.Count; i > 0; ar.unshift(PathQuoteSpaces(GetFileName(Items.Item(--i).Path)))) {
					}
					s = ExtractMacro(te, s.replace(/%selected%/ig, ar.join(" ")).replace(/%dest%/ig, Dest.Path).replace(/%src%/ig, GetParentFolderName(Items.Item(0).Path)));
					ShellExecute(PathQuoteSpaces(cmd.Path) + " " + s, (cmd.Flags & 2) ? "RunAs" : null, (cmd.Flags & 4) ? SW_HIDE : SW_SHOWNORMAL);
				} else if (/%selected%/i.test(s)) {
					const ar = [];
					for (let i = Items.Count; i > 0; ar.unshift(PathQuoteSpaces(Items.Item(--i).Path))) {
					}
					s = ExtractMacro(te, s.replace(/%selected%/ig, ar.join(" ")).replace(/%dest%/ig, Dest.Path));
					ShellExecute(PathQuoteSpaces(cmd.Path) + " " + s, (cmd.Flags & 2) ? "RunAs" : null, (cmd.Flags & 4) ? SW_HIDE : SW_SHOWNORMAL);
				} else {
					const oExec = wsh.Exec([cmd.Path, ExtractMacro(te, s.replace(/%dest%/i, Dest.Path))].join(" "));
					const hwnd = GethwndFromPid(oExec.ProcessID, 1);
					api.PostMessage(hwnd, WM_DROPFILES, Items.hDrop, 0);
					setTimeout(function () {
						api.SetWindowPos(hwnd, HWND_TOP, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE);
						api.PostMessage(hwnd, WM_KEYDOWN, VK_RETURN, 0);
						api.PostMessage(hwnd, WM_KEYUP, VK_RETURN, 0);
					}, 99);
				}
			} else {
				if (ExtraMenuCommand[nVerb]) {
					if (InvokeFunc(ExtraMenuCommand[nVerb], [Ctrl, pt, Name, nVerb, Items, Dest]) != S_FALSE) {
						api.DestroyMenu(hMenu);
						return true;
					}
				}
				if (eventTE.menus.dragdrop) {
					const hr = InvokeFunc(eventTE.menucommand.dragdrop, [Ctrl, pt, "DragDrop", nVerb, hMenu, Items, Dest]);
					if (isFinite(hr) && hr == S_OK) {
						api.DestroyMenu(hMenu);
						return true;
					}
				}
				for (let i = 0; i < ContextMenus.length; ++i) {
					const ContextMenu = ContextMenus[i];
					if (nVerb >= ContextMenu.idCmdFirst && nVerb <= ContextMenu.idCmdLast) {
						ContextMenu.InvokeCommand(0, te.hwnd, nVerb - ContextMenu.idCmdFirst, null, null, SW_SHOWNORMAL, 0, 0);
						break;
					}
				}
			}
			api.DestroyMenu(hMenu);
			return true;
		}
	},

	IsFileSystem: function (path, wfd) {
		const hFind = api.FindFirstFile(path, wfd);
		if (hFind != INVALID_HANDLE_VALUE) {
			api.FindClose(hFind);
			return true;
		}
		if (api.PathIsRoot(path)) {
			wfd.dwFileAttributes = FILE_ATTRIBUTE_DIRECTORY;
			return true;
		}
		return false;
	},
};

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	switch (Ctrl.Type) {
		case CTRL_SB:
		case CTRL_EB:
		case CTRL_TV:
			let Dest = Ctrl.HitTest(pt);
			if (Dest) {
				if (!fso.FolderExists(Dest.Path)) {
					if (api.DropTarget(Dest)) {
						return E_FAIL;
					}
					Dest = Ctrl.FolderItem;
				}
			} else {
				Dest = Ctrl.FolderItem;
			}
			if (Dest && Sync.DragDropMenu.FO(Ctrl, dataObj, Dest, grfKeyState, pt, pdwEffect)) {
				return S_OK
			}
			break;
		case CTRL_DT:
			if (Sync.DragDropMenu.FO(null, dataObj, Ctrl.FolderItem, grfKeyState, pt, pdwEffect)) {
				return S_OK
			}
			break;
	}
}, true);
