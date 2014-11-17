importScripts("..\\..\\script\\consts.js");

if (MainWindow.Exchange) {
	var ex = MainWindow.Exchange[arg[3]];
	if (ex) {
		delete MainWindow.Exchange[arg[3]];
		if (ex.Dest === null) {
			var ContextMenu = api.ContextMenu(ex.Items);
			if (ContextMenu) {
				var hMenu = api.CreatePopupMenu();
				ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
				ContextMenu.InvokeCommand(0, te.hwnd, CommandID_DELETE - 1, null, null, SW_SHOWNORMAL, null, null);
				api.DestroyMenu(hMenu);
			}
		}
		else {
			var DropTarget = api.DropTarget(ex.Dest);
			var pdwEffect = api.Memory("DWORD");
			pdwEffect[0] = ex.dwEffect;
			DropTarget.Drop(ex.Items, ex.grfKeyState, ex.pt, pdwEffect);
		}
	}
}
