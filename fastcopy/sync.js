var Addon_Id = "fastcopy";
var item = GetAddonElement(Addon_Id);

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
			var pidTemp = api.ILCreateFromPath(fso.GetSpecialFolder(2).Path);
			pidTemp.IsFolder;
			var strTemp = pidTemp.Path + "\\";
			var strTemp2;
			var wfd = api.Memory("WIN32_FIND_DATA");
			var Items2 = api.CreateObject("FolderItems");
			for (var i = Items.Count; i-- > 0;) {
				var path1 = Items.Item(i).Path;
				var hFind = api.FindFirstFile(path1, wfd);
				api.FindClose(hFind);
				if (hFind != INVALID_HANDLE_VALUE) {
					if (!bDelete && !api.StrCmpNI(path1, strTemp, strTemp.length)) {
						if (!strTemp2) {
							if (Sync.FastCopy.opt.NoTemp) {
								return false;
							}
							do {
								strTemp2 = strTemp + "tablacus\\" + fso.GetTempName() + "\\";
							} while (IsExists(strTemp2));
							CreateFolder(strTemp2);
						}
						if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
							fso.MoveFolder(path1, strTemp2);
						} else {
							fso.MoveFile(path1, strTemp2);
						}
						path1 = strTemp2 + fso.GetFileName(path1);
					}
				} else {
					return false;
				}
				Items2.AddItem(path1);
			}
			var hDrop = strTemp2 ? Items2.hDrop : Items.hDrop;
			var strFunc;
			var bStart;
			if (bDelete) {
				strFunc = Sync.FastCopy.opt.Delete;
				bStart = Sync.FastCopy.opt.DeleteStart;
			} else {
				if (bOver) {
					var DropTarget = api.DropTarget(Dest);
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
				setTimeout(function () {
					var oExec = wsh.Exec([Sync.FastCopy.opt.strCmd, strFunc.replace(/%dest%/i, Dest)].join(" "));
					var hwnd = GethwndFromPid(oExec.ProcessID, 1);
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

var attrs = item.attributes;
for (var i = attrs.length; i-- > 0;) {
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
				var Dest = Ctrl.HitTest(pt);
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
					var Items = api.OleGetClipboard()
					if (Sync.FastCopy.FO(null, Items, Ctrl.FolderItem, MK_LBUTTON, null, Items.pdwEffect, false)) {
						return S_OK;
					}
					break;
				case CommandID_DELETE:
					var Items = Ctrl.SelectedItems();
					if (Sync.FastCopy.FO(null, Items, "", MK_LBUTTON, null, Items.pdwEffect, false, true)) {
						return S_OK;
					}
					break;
			}
		}
	});

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
		switch (Verb + 1) {
			case CommandID_PASTE:
				var Target = ContextMenu.Items();
				if (Target.Count) {
					var Items = api.OleGetClipboard()
					if (Sync.FastCopy.FO(null, Items, Target.Item(0), MK_LBUTTON, null, Items.pdwEffect, false)) {
						return S_OK;
					}
				}
				break;
			case CommandID_DELETE:
				var Items = ContextMenu.Items();
				if (Sync.FastCopy.FO(null, Items, "", MK_LBUTTON, null, Items.pdwEffect, false, true)) {
					return S_OK;
				}
				break;
		}
	});
}
