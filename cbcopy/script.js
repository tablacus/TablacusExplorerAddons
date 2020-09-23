if (window.Addon == 1) {
	Addons.CBCopy =
	{
		Copy: function (Items) {
			var pdwEffect = Items.pdwEffect;
			if (pdwEffect) {
				pdwEffect[0] = DROPEFFECT_COPY | DROPEFFECT_LINK;
			}
			Items.UseText = true;
			api.OleSetClipboard(Items);
			return S_OK;
		}
	}

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
		if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
			if ((wParam & 0xfff) == CommandID_COPY - 1) {
				return Addons.CBCopy.Copy(Ctrl.SelectedItems());
			}
		}
	});

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
		if (Verb == CommandID_COPY - 1) {
			return Addons.CBCopy.Copy(ContextMenu.Items);
		}
	});
}
