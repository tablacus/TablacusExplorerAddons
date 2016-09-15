if (window.Addon == 1) {
	Addons.MultiProcess =
	{
		FO: function (Ctrl, Items, Dest, grfKeyState, pt, pdwEffect, nMode)
		{
			if (Items.Count == 0) {
				return false;
			}
			var dwEffect = pdwEffect[0];
			if (Dest !== null) {
				if (!(grfKeyState & MK_CONTROL) && api.ILIsEqual(Dest, Items.Item(-1))) {
					return false;
				}
				if (api.ILIsParent(wsh.ExpandEnvironmentStrings("%TEMP%"), Items.Item(-1), false)) {
					return false;
				}
				var path = api.GetDisplayNameOf(Dest, SHGDN_FORPARSING);
				if (/^::{/.test(path) || (/^[A-Z]:\\|^\\/i.test(path) && !fso.FolderExists(path))) {
					return false;
				}
				if (nMode == 0) {
					var DropTarget = api.DropTarget(Dest);
					DropTarget.DragOver(Items, grfKeyState, pt, pdwEffect);
				}
			}
			else if (/^::{/.test(api.GetDisplayNameOf(Items.Item(-1), SHGDN_FORPARSING))) {
				return false;
			}
			OpenNewProcess("addons\\multiprocess\\worker.js",
			{
				hwnd: api.GetForegroundWindow(),
				Items: Items,
				Dest: Dest,
				Mode: nMode,
				grfKeyState: grfKeyState,
				pt: pt,
				dwEffect: dwEffect
			});
			return true;
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
				if (Dest && Addons.MultiProcess.FO(Ctrl, dataObj, Dest, grfKeyState, pt, pdwEffect, 0)) {
					return S_OK
				}
				break;
			case CTRL_DT:
				if (Addons.MultiProcess.FO(null, dataObj, Ctrl.FolderItem, grfKeyState, pt, pdwEffect, 0)) {
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
					var Items = api.OleGetClipboard();
					if (!api.ILIsEmpty(Items.Item(-1)) && Addons.MultiProcess.FO(null, Items, Ctrl.FolderItem, MK_LBUTTON, null, Items.pdwEffect, 2)) {
						return S_OK;
					}
					break;
				case CommandID_DELETE:
					var Items = Ctrl.SelectedItems();
					if (Addons.MultiProcess.FO(null, Items, null, MK_LBUTTON, null, Items.pdwEffect, 1)) {
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
					if (Addons.MultiProcess.FO(null, Items, Target.Item(0), MK_LBUTTON, null, Items.pdwEffect, 2)) {
						return S_OK;
					}
				}
				break;
			case CommandID_DELETE:
				var Items = ContextMenu.Items();
				if (Addons.MultiProcess.FO(null, Items, null, MK_LBUTTON, null, Items.pdwEffect, 1)) {
					return S_OK;
				}
				break;
		}
	});
}
