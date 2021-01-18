const Addon_Id = "duplicatecopy";
const Default = "None";
const item = GetAddonElement(Addon_Id);

Sync.DuplicateCopy = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			FV.Focus();
			Sync.DuplicateCopy.FO(FV, FV.SelectedItems(), FV.FolderItem, MK_LBUTTON, null, [DROPEFFECT_COPY], false, true);
		}
	},

	FO: function (Ctrl, Items, Dest, grfKeyState, pt, pdwEffect, bOver, bForce) {
		let path;
		if (!(grfKeyState & MK_LBUTTON) || Items.Count == 0) {
			return false;
		}
		const Parent = Items.Item(-1);
		try {
			path = Dest.ExtendedProperty("linktarget") || api.GetDisplayNameOf(Dest, SHGDN_FORPARSING | SHGDN_ORIGINAL);
		} catch (e) {
			path = api.GetDisplayNameOf(Dest, SHGDN_FORPARSING | SHGDN_ORIGINAL);
		}
		if (path && path == api.GetDisplayNameOf(Parent, SHGDN_FORPARSING | SHGDN_ORIGINAL) && fso.FolderExists(path)) {
			const arFrom = [];
			for (i = Items.Count - 1; i >= 0; i--) {
				const path1 = Items.Item(i).Path;
				if (IsExists(path1)) {
					arFrom.unshift(path1);
				} else {
					pdwEffect[0] = DROPEFFECT_NONE;
					break;
				}
			}
			if (pdwEffect[0]) {
				if (bOver) {
					const DropTarget = api.DropTarget(path);
					DropTarget.DragOver(Items, grfKeyState, pt, pdwEffect);
				}
				if (pdwEffect[0] & DROPEFFECT_COPY) {
					if (arFrom.length > 1) {
						const bResult = confirmOk();
						if (bForce && bResult) {
							const arDest = [];
							for (let i = arFrom.length; i--;) {
								arDest.unshift(Sync.DuplicateCopy.GetTempName(arFrom[i]));
							}
							api.SHFileOperation(FO_COPY, arFrom.join("\0"), arDest.join("\0"), FOF_ALLOWUNDO | FOF_MULTIDESTFILES | FOF_RENAMEONCOLLISION, true);
							return true
						}
						return !bResult;
					}
					if (arFrom.length) {
						const fn = Sync.DuplicateCopy.GetTempName(arFrom[0]);
						InputDialog(GetFileName(arFrom[0]), GetFileName(fn), function (s) {
							if (s) {
								s = BuildPath(fso.GetParentFolderName(fn), s);
								if (IsExists(s)) {
									MessageBox(api.LoadString(hShell32, 6327));
									return false;
								}
								api.SHFileOperation(FO_COPY, arFrom[0], s, FOF_ALLOWUNDO | FOF_RENAMEONCOLLISION, true);
								const FV = GetFolderView(Ctrl);
								if (FV.Type <= CTRL_EB) {
									setTimeout(function () {
										FV.SelectItem(s, SVSI_FOCUSED | SVSI_SELECT | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS);
									}, 99);
								}
							}
						});
						return true;
					}
				}
			}
		}
		return false;
	},

	GetTempName: function (fn) {
		let cp;
		try {
			cp = wsh.regRead("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\NamingTemplates\\CopyNameTemplate");
		} catch (e) { }
		if (!cp) {
			cp = api.LoadString(hShell32, 4178) || "%s - Copy";
		}
		const pfn = GetParentFolderName(fn);
		const bn = fso.GetBaseName(fn);
		let ext = fso.GetExtensionName(fn);
		if (ext) {
			ext = '.' + ext;
		}
		if (!/\(\)/.test(cp)) {
			cp += " ()";
		}
		if (!/%s/.test(cp)) {
			cp += "%s";
		}
		const m = bn.length + cp.length + 9;
		let cp1 = api.sprintf(m, cp.replace(/\s?\(\)/, ""), bn) + ext;
		for (let i = 2; IsExists(BuildPath(pfn, cp1)); i++) {
			cp1 = api.sprintf(m, cp.replace(/(\s?\()(\))/, "$1" + i + "$2"), bn) + ext;
		}
		return BuildPath(pfn, cp1)
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
			if (Dest && Sync.DuplicateCopy.FO(Ctrl, dataObj, Dest, grfKeyState, pt, pdwEffect, true)) {
				return S_OK
			}
			break;
		case CTRL_DT:
			if (Sync.DuplicateCopy.FO(null, dataObj, Ctrl.FolderItem, grfKeyState, pt, pdwEffect, true)) {
				return S_OK
			}
			break;
	}
}, true);

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
		switch ((wParam & 0xfff) + 1) {
			case CommandID_PASTE:
				const Items = api.OleGetClipboard()
				if (Sync.DuplicateCopy.FO(null, Items, Ctrl.FolderItem, MK_LBUTTON, null, Items.pdwEffect, false)) {
					return S_OK;
				}
				break;
		}
	}
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	switch (Verb + 1) {
		case CommandID_PASTE:
			const Target = ContextMenu.Items();
			if (Target.Count) {
				const Items = api.OleGetClipboard()
				if (Sync.DuplicateCopy.FO(null, Items, Target.Item(0), MK_LBUTTON, null, Items.pdwEffect, false)) {
					return S_OK;
				}
			}
			break;
	}
}, true);

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.DuplicateCopy.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.DuplicateCopy.strName);
		ExtraMenuCommand[nPos] = Sync.DuplicateCopy.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.DuplicateCopy.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.DuplicateCopy.Exec, "Func");
}
AddTypeEx("Add-ons", "Duplicate copy", Sync.DuplicateCopy.Exec);
