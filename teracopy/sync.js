const Addon_Id = "teracopy";
const item = GetAddonElement(Addon_Id);

Sync.TeraCopy = {
	bDiffDriveOnly: item.getAttribute("DiffDriveOnly"),
	NoTemp: item.getAttribute("NoTemp"),
	Copy: GetNum(item.getAttribute("Copy")),
	Move: GetNum(item.getAttribute("Move")),
	Path: ExtractPath(item.getAttribute("Path" + g_.bit) + ""),
	Class: item.getAttribute("Class" + g_.bit) || g_.bit < 64 ? "{A7005AF0-D6E8-48AF-8DFA-023B1CF660A7}" : "{A7645AF0-D6E8-48AF-8DFA-023B1CF660A7}",

	FO: function (Ctrl, Items, Dest, grfKeyState, pt, pdwEffect, bOver) {
		if (Items.Count == 0 || !(grfKeyState & MK_LBUTTON)) {
			return false;
		}
		if (Dest) {
			try {
				path = Dest.ExtendedProperty("linktarget") || Dest.Path || Dest;
			} catch (e) {
				path = Dest.Path || Dest;
			}
			if (path && fso.FolderExists(path)) {
				const pidTemp = api.ILCreateFromPath(fso.GetSpecialFolder(2).Path);
				pidTemp.IsFolder;
				const strTemp = pidTemp.Path + "\\";
				let strTemp2;
				const wfd = api.Memory("WIN32_FIND_DATA");
				const Items2 = api.CreateObject("FolderItems");
				for (let i = 0; i < Items.Count; ++i) {
					let path1 = Items.Item(i).Path;
					const hFind = api.FindFirstFile(path1, wfd);
					if (hFind != INVALID_HANDLE_VALUE) {
						api.FindClose(hFind);
						if (!api.StrCmpNI(path1, strTemp, strTemp.length)) {
							if (!strTemp2) {
								if (Sync.TeraCopy.NoTemp) {
									return false;
								}
								do {
									strTemp2 = strTemp + "tablacus\\" + fso.GetTempName() + "\\";
								} while (IsExists(strTemp2));
								CreateFolder(strTemp2);
							}
							path1 = strTemp2 + fso.GetFileName(path1);
						}
					} else {
						delete strTemp2;
						pdwEffect[0] = DROPEFFECT_NONE;
						break;
					}
					Items2.AddItem(path1);
				}
				if (pdwEffect[0]) {
					nVerb = -1;
					if (bOver) {
						const DropTarget = api.DropTarget(path);
						DropTarget.DragOver(Items, grfKeyState, pt, pdwEffect);
					}
					if (pdwEffect[0] & DROPEFFECT_COPY) {
						nVerb = Sync.TeraCopy.Copy;
					} else if (pdwEffect[0] & DROPEFFECT_MOVE) {
						if (!(Sync.TeraCopy.bDiffDriveOnly && api.PathIsSameRoot(Items.Item(-1).Path, path))) {
							nVerb = Sync.TeraCopy.Move;
						}
					}
					if (nVerb > 0) {
						if (strTemp2) {
							for (let i = 0; i < Items.Count; ++i) {
								const path1 = Items.Item(i).Path;
								const hFind = api.FindFirstFile(path1, wfd);
								if (hFind != INVALID_HANDLE_VALUE) {
									api.FindClose(hFind);
									if (!api.StrCmpNI(path1, strTemp, strTemp.length)) {
										if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
											fso.MoveFolder(path1, strTemp2);
										} else {
											fso.MoveFile(path1, strTemp2);
										}
									}
								}
							}
							Items = Items2;
						}
						const ContextMenu = api.ContextMenu(Sync.TeraCopy.Path, Sync.TeraCopy.Class, path, Items, HKEY_CLASSES_ROOT, "Folder", null);
						if (ContextMenu) {
							const hMenu = api.CreatePopupMenu();
							ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_NORMAL);
							ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 1, null, null, SW_SHOWNORMAL, 0, 0);
							api.DestroyMenu(hMenu);
							return true;
						}
					}
				}
			}
		}
		return false;
	}
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
			if (Dest && Sync.TeraCopy.FO(Ctrl, dataObj, Dest, grfKeyState, pt, pdwEffect, true)) {
				return S_OK
			}
			break;
		case CTRL_DT:
			if (Sync.TeraCopy.FO(null, dataObj, Ctrl.FolderItem, grfKeyState, pt, pdwEffect, true)) {
				return S_OK
			}
			break;
	}
});

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
		switch ((wParam & 0xfff) + 1) {
			case CommandID_PASTE:
				const Items = api.OleGetClipboard()
				if (Sync.TeraCopy.FO(null, Items, Ctrl.FolderItem, MK_LBUTTON, null, Items.pdwEffect, false)) {
					return S_OK;
				}
				break;
		}
	}
});

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	switch (Verb + 1) {
		case CommandID_PASTE:
			const Target = ContextMenu.Items();
			if (Target.Count) {
				const Items = api.OleGetClipboard()
				if (Sync.TeraCopy.FO(null, Items, Target.Item(0), MK_LBUTTON, null, Items.pdwEffect, false)) {
					return S_OK;
				}
			}
			break;
	}
});
