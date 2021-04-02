const Addon_Id = "fastcopy";
const item = GetAddonElement(Addon_Id);

Sync.FastCopy = {
	opt: {},

	FO: function (Ctrl, Items, Dest, grfKeyState, pt, pdwEffect, bOver, bDelete) {
		if (!(grfKeyState & MK_LBUTTON) || Items.Count == 0) {
			return false;
		}
		if (Dest) {
			try {
				Dest = Dest.ExtendedProperty("linktarget") || Dest.Path;
			} catch (e) {
				Dest = Dest.Path;
			}
		}
		if (bDelete || (Dest != "" && fso.FolderExists(Dest))) {
			const strTemp = GetTempPath(4);
			let strTemp2;
			const wfd = api.Memory("WIN32_FIND_DATA");
			const Items2 = api.CreateObject("FolderItems");
			for (let i = 0; i < Items.Count; ++i) {
				let path1 = Items.Item(i).Path;
				const hFind = api.FindFirstFile(path1, wfd);
				if (hFind != INVALID_HANDLE_VALUE) {
					api.FindClose(hFind);
					if (!bDelete && !api.StrCmpNI(path1, strTemp, strTemp.length)) {
						if (!strTemp2) {
							if (Sync.FastCopy.opt.NoTemp) {
								return false;
							}
							strTemp2 = GetTempPath(7);
							CreateFolder(strTemp2);
						}
						path1 = strTemp2 + fso.GetFileName(path1);
					}
				} else {
					return false;
				}
				Items2.AddItem(path1);
			}
			const hDrop = strTemp2 ? Items2.hDrop : Items.hDrop;
			let strFunc;
			let bStart;
			if (bDelete) {
				strFunc = Sync.FastCopy.opt.Delete;
				bStart = Sync.FastCopy.opt.DeleteStart;
			} else {
				if (bOver) {
					const DropTarget = api.DropTarget(Dest);
					DropTarget.DragOver(Items, grfKeyState, pt, pdwEffect);
				}
				if (pdwEffect[0] & DROPEFFECT_COPY) {
					strFunc = Sync.FastCopy.opt.Copy;
					bStart = Sync.FastCopy.opt.CopyStart;
				} else if (pdwEffect[0] & DROPEFFECT_MOVE) {
					strFunc = Sync.FastCopy.opt.DiffDriveOnly && api.PathIsSameRoot(api.DragQueryFile(hDrop, 0), Dest) ? "" : Sync.FastCopy.opt.Move;
					bStart = Sync.FastCopy.opt.MoveStart;
				}
			}
			if (strFunc) {
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
				}
				setTimeout(function () {
					const oExec = wsh.Exec([Sync.FastCopy.opt.strCmd, strFunc.replace(/%dest%/i, Dest)].join(" "));
					const hwnd = GethwndFromPid(oExec.ProcessID, 1);
					api.PostMessage(hwnd, WM_DROPFILES, hDrop, 0);
					setTimeout(function () {
						api.SetWindowPos(hwnd, HWND_TOP, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE);
						if (bStart) {
							api.PostMessage(hwnd, WM_KEYDOWN, VK_RETURN, 0);
							api.PostMessage(hwnd, WM_KEYUP, VK_RETURN, 0);
						}
					}, 99);
				}, 1);
				return true;
			}
			api.DragFinish(hDrop);
		}
		return false;
	}
};

const attrs = item.attributes;
for (let i = attrs.length; i-- > 0;) {
	Sync.FastCopy.opt[attrs[i].name] = attrs[i].value;
}
Sync.FastCopy.opt.strCmd = api.PathUnquoteSpaces(ExtractMacro(te, Sync.FastCopy.opt.Path));

if (Sync.FastCopy.opt.strCmd && fso.FileExists(Sync.FastCopy.opt.strCmd)) {
	Sync.FastCopy.opt.strCmd = api.PathQuoteSpaces(Sync.FastCopy.opt.strCmd);
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
				if (Dest && Sync.FastCopy.FO(Ctrl, dataObj, Dest, grfKeyState, pt, pdwEffect, true)) {
					return S_OK
				}
				break;
			case CTRL_DT:
				if (Sync.FastCopy.FO(null, dataObj, Ctrl.FolderItem, grfKeyState, pt, pdwEffect, true)) {
					return S_OK
				}
				break;
		}
	});

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
		if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
			switch ((wParam & 0xfff) + 1) {
				case CommandID_PASTE:
					let Items = api.OleGetClipboard()
					if (Sync.FastCopy.FO(null, Items, Ctrl.FolderItem, MK_LBUTTON, null, Items.pdwEffect, false)) {
						return S_OK;
					}
					break;
				case CommandID_DELETE:
					Items = Ctrl.SelectedItems();
					if (Sync.FastCopy.FO(null, Items, "", MK_LBUTTON, null, Items.pdwEffect, false, true)) {
						return S_OK;
					}
					break;
			}
		}
	});

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
		let Items;
		switch (Verb + 1) {
			case CommandID_PASTE:
				const Target = ContextMenu.Items();
				if (Target.Count) {
					Items = api.OleGetClipboard()
					if (Sync.FastCopy.FO(null, Items, Target.Item(0), MK_LBUTTON, null, Items.pdwEffect, false)) {
						return S_OK;
					}
				}
				break;
			case CommandID_DELETE:
				Items = ContextMenu.Items();
				if (Sync.FastCopy.FO(null, Items, "", MK_LBUTTON, null, Items.pdwEffect, false, true)) {
					return S_OK;
				}
				break;
		}
	});
}
