if (window.Addon == 1) {
	Addons.MultiProcess =
	{
		FO: function (Ctrl, Items, Dest, grfKeyState, pt, pdwEffect, bOver)
		{
			if (Items.Count == 0) {
				return false;
			}
			var dwEffect = pdwEffect[0];
			if (Dest !== null) {
				if (api.ILIsParent(wsh.ExpandEnvironmentStrings("%TEMP%"), Items.Item(-1), false)) {
					return false;
				}
				var path = api.GetDisplayNameOf(Dest, SHGDN_FORPARSING);
				if (/^::{/.test(path) || (/^[A-Z]:\\|^\\/i.test(path) && !fso.FolderExists(path))) {
					return false;
				}
				if (bOver) {
					var DropTarget = api.DropTarget(Dest);
					DropTarget.DragOver(Items, grfKeyState, pt, pdwEffect);
				}
			}
			else if (/^::{/.test(api.GetDisplayNameOf(Items.Item(-1), SHGDN_FORPARSING))) {
				return false;
			}
			var uid;
			do {
				uid = String(Math.random()).replace(/^0?\./, "");
			} while (Exchange[uid]);
			Exchange[uid] = 
			{
				Items: Items,
				Dest: Dest,
				grfKeyState: grfKeyState,
				pt: pt,
				dwEffect: dwEffect
			};
			var oExec = wsh.Exec([api.PathQuoteSpaces(api.GetModuleFileName(null)), '/run', "addons\\multiprocess\\worker.js", uid].join(" "));
			wsh.AppActivate(oExec.ProcessID);
			return true;
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
					if (Addons.MultiProcess.FO(null, Items, null, MK_LBUTTON, null, Items.pdwEffect, false)) {
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
				if (Addons.MultiProcess.FO(null, Items, null, MK_LBUTTON, null, Items.pdwEffect, false)) {
					return S_OK;
				}
				break;
		}
	});

	te.HookDragDrop(CTRL_FV, true);
	te.HookDragDrop(CTRL_TV, true);
}
