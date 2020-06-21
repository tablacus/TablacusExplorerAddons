if (window.Addon == 1) {
	Addons.FastCopy =
	{
		FO: function (Ctrl, Items, Dest, grfKeyState, pt, pdwEffect, bOver, bDelete) {
			if (!(grfKeyState & MK_LBUTTON) || Items.Count == 0) {
				return false;
			}
			var fastcopy = te.Data.Addons.getElementsByTagName("fastcopy");
			if (fastcopy.length == 0) {
				return false;
			}
			var item = fastcopy[0];
			var strCmd = api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("Path")));
			if (!strCmd || !fso.FileExists(strCmd)) {
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
				var strTemp = (fso.GetSpecialFolder(2).Path + "\\").replace(/\\\\$/, "\\");
				var strTemp2;
				var arRen1 = [], arRen2 = [];
				var Items2 = api.CreateObject("FolderItems");
				for (var i = Items.Count; i-- > 0;) {
					var path1 = Items.Item(i).Path;
					if (IsExists(path1)) {
						if (!bDelete && !api.StrCmpNI(path1, strTemp, strTemp.length)) {
							if (!arRen1.length) {
								if (item.getAttribute("NoTemp")) {
									return false;
								}
								strTemp2 = strTemp + "tablacus\\" + fso.GetTempName() + "\\";
								DeleteItem(strTemp2);
							}
							arRen1.unshift(path1);
							path1 = strTemp2 + path1.slice(strTemp.length);
							arRen2.unshift(path1);
							CreateFolder(fso.GetParentFolderName(path1));
						}
					} else {
						return false;
					}
					Items2.AddItem(path1);
				}
				if (arRen1.length) {
					api.SHFileOperation(FO_MOVE, arRen1.join("\0"), arRen2.join("\0"), FOF_MULTIDESTFILES | FOF_SILENT, false);
				}
				var hDrop = arRen1.length ? Items2.hDrop : Items.hDrop;
				var strFunc;
				var bStart;
				if (bDelete) {
					strFunc = item.getAttribute("Delete");
					bStart = item.getAttribute("DeleteStart");
				} else {
					if (bOver) {
						var DropTarget = api.DropTarget(Dest);
						DropTarget.DragOver(Items, grfKeyState, pt, pdwEffect);
					}
					if (pdwEffect[0] & DROPEFFECT_COPY) {
						strFunc = item.getAttribute("Copy");
						bStart = item.getAttribute("CopyStart");
					} else if (pdwEffect[0] & DROPEFFECT_MOVE) {
						strFunc = item.getAttribute("DiffDriveOnly") && api.PathIsSameRoot(api.DragQueryFile(hDrop, 0), Dest) ? "" : item.getAttribute("Move");
						bStart = item.getAttribute("MoveStart");
					}
				}
				if (strFunc) {
					setTimeout(function () {
						var oExec = wsh.Exec([api.PathQuoteSpaces(strCmd), strFunc.replace(/%dest%/i, Dest)].join(" "));
						var hwnd = GethwndFromPid(oExec.ProcessID);
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
				if (Dest && Addons.FastCopy.FO(Ctrl, dataObj, Dest, grfKeyState, pt, pdwEffect, true)) {
					return S_OK
				}
				break;
			case CTRL_DT:
				if (Addons.FastCopy.FO(null, dataObj, Ctrl.FolderItem, grfKeyState, pt, pdwEffect, true)) {
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
					if (Addons.FastCopy.FO(null, Items, Ctrl.FolderItem, MK_LBUTTON, null, Items.pdwEffect, false)) {
						return S_OK;
					}
					break;
				case CommandID_DELETE:
					var Items = Ctrl.SelectedItems();
					if (Addons.FastCopy.FO(null, Items, "", MK_LBUTTON, null, Items.pdwEffect, false, true)) {
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
					if (Addons.FastCopy.FO(null, Items, Target.Item(0), MK_LBUTTON, null, Items.pdwEffect, false)) {
						return S_OK;
					}
				}
				break;
			case CommandID_DELETE:
				var Items = ContextMenu.Items();
				if (Addons.FastCopy.FO(null, Items, "", MK_LBUTTON, null, Items.pdwEffect, false, true)) {
					return S_OK;
				}
				break;
		}
	});
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
