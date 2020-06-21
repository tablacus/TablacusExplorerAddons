var Addon_Id = "ffc";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Class", "{E6385E40-E2A6-11d5-ABE6-9EB61339EA35}");
	item.setAttribute("Copy", 1);
	item.setAttribute("Move", 2);
}
if (window.Addon == 1) {
	Addons.FFC =
	{
		bDiffDriveOnly: item.getAttribute("DiffDriveOnly"),
		NoTemp: item.getAttribute("NoTemp"),

		FO: function (Ctrl, Items, Dest, grfKeyState, pt, pdwEffect, bOver) {
			var i = Items.Count;
			if (i == 0 || !(grfKeyState & MK_LBUTTON)) {
				return false;
			}
			if (Dest) {
				try {
					path = Dest.ExtendedProperty("linktarget") || Dest.Path || Dest;
				} catch (e) {
					path = Dest.Path || Dest;
				}
				if (path && fso.FolderExists(path)) {
					var strTemp = (fso.GetSpecialFolder(2).Path + "\\").replace(/\\\\$/, "\\");
					var strTemp2;
					var arRen1 = [], arRen2 = [];
					var Items2 = api.CreateObject("FolderItems");
					while (i--) {
						var path1 = Items.Item(i).Path;
						if (IsExists(path1)) {
							if (!api.StrCmpNI(path1, strTemp, strTemp.length)) {
								if (!arRen1.length) {
									if (Addons.FFC.NoTemp) {
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
							arRen1.length = 0;
							pdwEffect[0] = DROPEFFECT_NONE;
							break;
						}
						Items2.AddItem(path1);
					}
					if (arRen1.length) {
						api.SHFileOperation(FO_MOVE, arRen1.join("\0"), arRen2.join("\0"), FOF_MULTIDESTFILES | FOF_SILENT, false);
						Items = Items2;
					}
					if (pdwEffect[0]) {
						nVerb = -1;
						if (bOver) {
							var DropTarget = api.DropTarget(path);
							DropTarget.DragOver(Items, grfKeyState, pt, pdwEffect);
						}
						if (pdwEffect[0] & DROPEFFECT_COPY) {
							nVerb = GetAddonOptionEx("ffc", "Copy");
						} else if (pdwEffect[0] & DROPEFFECT_MOVE) {
							if (!(Addons.FFC.bDiffDriveOnly && api.PathIsSameRoot(Items.Item(-1).Path, path))) {
								nVerb = GetAddonOptionEx("ffc", "Move");
							}
						}
						if (nVerb > 0) {
							var dll = api.PathUnquoteSpaces(ExtractMacro(te, GetAddonOption("ffc", "Path") + ""));
							var cls = GetAddonOption("ffc", "Class");
							var ContextMenu = api.ContextMenu(dll, cls, path, Items, HKEY_CLASSES_ROOT, "Folder", null) || api.ContextMenu(dll.replace(/_?64(\.dll)/i, "$1"), cls, path, Items, HKEY_CLASSES_ROOT, "Folder", null);
							if (ContextMenu) {
								var hMenu = api.CreatePopupMenu();
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
				if (Dest && Addons.FFC.FO(Ctrl, dataObj, Dest, grfKeyState, pt, pdwEffect, true)) {
					return S_OK
				}
				break;
			case CTRL_DT:
				if (Addons.FFC.FO(null, dataObj, Ctrl.FolderItem, grfKeyState, pt, pdwEffect, true)) {
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
					if (Addons.FFC.FO(null, Items, Ctrl.FolderItem, MK_LBUTTON, null, Items.pdwEffect, false)) {
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
					if (Addons.FFC.FO(null, Items, Target.Item(0), MK_LBUTTON, null, Items.pdwEffect, false)) {
						return S_OK;
					}
				}
				break;
		}
	});
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
