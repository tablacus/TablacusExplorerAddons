if (window.Addon == 1) { (function () {
	Addons.MultiProcess =
	{
		FO: function (Ctrl, Items, Dest, grfKeyState, pt, pdwEffect, bOver, bDelete)
		{
			if (Items.Count == 0) {
				return false;
			}
			var strCmd = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\multiprocess\\tcm" + (api.sizeof("HANDLE") * 8) + ".exe");
			if (!fso.FileExists(strCmd)) {
				return false;
			}
			if (!bDelete && api.ILIsParent(wsh.ExpandEnvironmentStrings("%TEMP%"), Items.Item(-1), false)) {
				return false;
			}
			if (Dest != "") {
				try {
					Dest = Dest.IsLink ? Dest.GetLink.Path : Dest.Path;
				} catch (e) {
					return false;
				}
			}
			if (bDelete || (Dest != "" && fso.FolderExists(Dest))) {
				var hDrop = Items.hDrop;
				if (Items.Count == api.DragQueryFile(hDrop, -1)) {
					var strFunc;
					if (bDelete) {
						strFunc = "-invoke delete";
					}
					else {
						if (bOver) {
							var DropTarget = api.DropTarget(Dest);
							DropTarget.DragOver(Items, grfKeyState, pt, pdwEffect);
						}
						strFunc = '-grfKeyState ' + grfKeyState + ' -drop "' + Dest + '"';
					}
					if (strFunc) {
						setTimeout(function () {
							var oExec = wsh.Exec([api.PathQuoteSpaces(strCmd), strFunc].join(" "));
							var hwnd = GethwndFromPid(oExec.ProcessID);
							api.PostMessage(hwnd, WM_DROPFILES, hDrop, 0);
							wsh.AppActivate(oExec.ProcessID);
						}, 1);
						return true;
					}
				}
				api.DragFinish(hDrop);
			}
			return false;
		}
	};

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		switch (Ctrl.Type) {
			case CTRL_SB:
			case CTRL_EB:
				var Items = Ctrl.Items();
				var Dest;
				var i = Ctrl.HitTest(pt, LVHT_ONITEM);
				if (i >= 0) {
					Dest = Items.Item(i);
					if (!fso.FolderExists(Dest.Path)) {
						if (api.DropTarget(Dest)) {
							return E_FAIL;
						}
						Dest = Ctrl.FolderItem;
					}
				}
				else {
					Dest = Ctrl.FolderItem;
				}
				if (Addons.MultiProcess.FO(Ctrl, dataObj, Dest, grfKeyState, pt, pdwEffect, true)) {
					return S_OK
				}
				break;
			case CTRL_DT:
				if (Addons.MultiProcess.FO(null, dataObj, Ctrl.FolderItem, grfKeyState, pt, pdwEffect, true)) {
					return S_OK
				}
				break;
		}
	});

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
			switch ((wParam & 0xfff) + 1) {
				case CommandID_PASTE:
					var Items = api.OleGetClipboard()
					if (Addons.MultiProcess.FO(null, Items, Ctrl.FolderItem, MK_LBUTTON, null, Items.pdwEffect, false)) {
						return S_OK;
					}
					break;
				case CommandID_DELETE:
					var Items = Ctrl.SelectedItems();
					if (Addons.MultiProcess.FO(null, Items, "", MK_LBUTTON, null, Items.pdwEffect, false, true)) {
						return S_OK;
					}
					break;
			}
		}
	});

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		switch (Verb + 1) {
			case CommandID_PASTE:
				var Target = ContextMenu.Items();
				if (Target.Count) {
					var Items = api.OleGetClipboard()
					if (Addons.MultiProcess.FO(null, Items, Target.Item(0), MK_LBUTTON, null, Items.pdwEffect, false)) {
						return S_OK;
					}
				}
				break;
			case CommandID_DELETE:
				var Items = ContextMenu.Items();
				if (Addons.MultiProcess.FO(null, Items, "", MK_LBUTTON, null, Items.pdwEffect, false, true)) {
					return S_OK;
				}
				break;
		}
	});

	te.HookDragDrop(CTRL_FV, true);
	te.HookDragDrop(CTRL_TV, true);
})();}
