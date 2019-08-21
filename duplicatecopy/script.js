var Addon_Id = "duplicatecopy";
var Default = "None";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);

	Addons.DuplicateCopy =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				Addons.DuplicateCopy.FO(FV, FV.SelectedItems(), FV.FolderItem, MK_LBUTTON, null, [DROPEFFECT_COPY], false, true);
			}
		},

		FO: function (Ctrl, Items, Dest, grfKeyState, pt, pdwEffect, bOver, bForce)
		{
			var path;
			if (!(grfKeyState & MK_LBUTTON) || Items.Count == 0) {
				return false;
			}
			var Parent = Items.Item(-1);
			try {
				path = Dest.ExtendedProperty("linktarget") || api.GetDisplayNameOf(Dest, SHGDN_FORPARSING | SHGDN_ORIGINAL);
			} catch (e) {
				path = api.GetDisplayNameOf(Dest, SHGDN_FORPARSING | SHGDN_ORIGINAL);
			}
			if (path && path == api.GetDisplayNameOf(Parent, SHGDN_FORPARSING | SHGDN_ORIGINAL) && fso.FolderExists(path)) {
				var arFrom = [];
				for (i = Items.Count - 1; i >= 0; i--) {
					var path1 = Items.Item(i).Path;
					if (IsExists(path1)) {
						arFrom.unshift(path1);
					} else {
						pdwEffect[0] = DROPEFFECT_NONE;
						break;
					}
				}
				if (pdwEffect[0]) {
					var wFunc = 0;
					if (bOver) {
						var DropTarget = api.DropTarget(path);
						DropTarget.DragOver(Items, grfKeyState, pt, pdwEffect);
					}
					if (pdwEffect[0] & DROPEFFECT_COPY) {
						if (arFrom.length > 1) {
							var bResult = confirmOk();
							if (bForce && bResult) {
								var arDest = [];
								for (var i = arFrom.length; i--;) {
									arDest.unshift(Addons.DuplicateCopy.GetTempName(arFrom[i]));
								}
								api.SHFileOperation(FO_COPY, arFrom.join("\0"), arDest.join("\0"), FOF_ALLOWUNDO | FOF_MULTIDESTFILES | FOF_RENAMEONCOLLISION, true);
								return true
							}
							return !bResult;
						}
						if (arFrom.length) {
							var fn = Addons.DuplicateCopy.GetTempName(arFrom[0]);
							var s = InputDialog(fso.GetFileName(fn), fso.GetFileName(fn));
							if (s) {
								s = fso.BuildPath(fso.GetParentFolderName(fn), s);
								if (IsExists(s)) {
									MessageBox(api.LoadString(hShell32, 6327));
									return false;
								}
								api.SHFileOperation(FO_COPY, arFrom[0], s, FOF_ALLOWUNDO | FOF_RENAMEONCOLLISION, true);
								var FV = GetFolderView(Ctrl);
								if (FV.Type <= CTRL_EB) {
									setTimeout(function ()
									{
										FV.SelectItem(s, SVSI_FOCUSED | SVSI_SELECT | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS);
									}, 99);
								}
							}
							return true;
						}
					}
				}
			}
			return false;
		},

		GetTempName: function (fn)
		{
			var cp = api.LoadString(hShell32, 4178) || "%s - Copy";
			var pfn = fso.GetParentFolderName(fn);
			var bn = fso.GetBaseName(fn);
			var ext = fso.GetExtensionName(fn);
			if (ext) {
				ext = '.' + ext;
			}
			if (!/\(\)/.test(cp)) {
				cp += " ()";
			}
			if (!/%s/.test(cp)) {
				cp += "%s";
			}
			var m = bn.length + cp.length + 9;
			var cp1 = api.sprintf(m, cp.replace(/\s?\(\)/, ""), bn) + ext;
			for (var i = 2; IsExists(fso.BuildPath(pfn, cp1)); i++) {
				cp1 = api.sprintf(m, cp.replace(/(\s?\()(\))/, "$1" + i + "$2"), bn) + ext;
			}
			return fso.BuildPath(pfn, cp1)
		}
	};

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
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
				if (Dest && Addons.DuplicateCopy.FO(Ctrl, dataObj, Dest, grfKeyState, pt, pdwEffect, true)) {
					return S_OK
				}
				break;
			case CTRL_DT:
				if (Addons.DuplicateCopy.FO(null, dataObj, Ctrl.FolderItem, grfKeyState, pt, pdwEffect, true)) {
					return S_OK
				}
				break;
		}
	}, true);

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
			switch ((wParam & 0xfff) + 1) {
				case CommandID_PASTE:
					var Items = api.OleGetClipboard()
					if (Addons.DuplicateCopy.FO(null, Items, Ctrl.FolderItem, MK_LBUTTON, null, Items.pdwEffect, false)) {
						return S_OK;
					}
					break;
			}
		}
	}, true);

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		switch (Verb + 1) {
			case CommandID_PASTE:
				var Target = ContextMenu.Items();
				if (Target.Count) {
					var Items = api.OleGetClipboard()
					if (Addons.DuplicateCopy.FO(null, Items, Target.Item(0), MK_LBUTTON, null, Items.pdwEffect, false)) {
						return S_OK;
					}
				}
				break;
		}
	}, true);

	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.DuplicateCopy.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.DuplicateCopy.strName);
			ExtraMenuCommand[nPos] = Addons.DuplicateCopy.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.DuplicateCopy.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.DuplicateCopy.Exec, "Func");
	}
	AddTypeEx("Add-ons", "Duplicate copy", Addons.DuplicateCopy.Exec);

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,6" : "bitmap:ieframe.dll,214,24,6");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.DuplicateCopy.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.DuplicateCopy.strName, src: src }, h), '</span>']);
} else {
	EnableInner();
}