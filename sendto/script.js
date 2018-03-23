if (window.Addon == 1) {
	AddType("Send to",
	{
		Exec: function (Ctrl, s, type, hwnd, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			var Selected = FV.SelectedItems();
			var DropTarget = api.DropTarget(s);
			if (Selected && Selected.Count && DropTarget) {
				var pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
				DropTarget.Drop(Selected, MK_LBUTTON, pt, pdwEffect);
			}
			return S_OK;
		},

		Ref: function (path) {
			return OpenDialog(path || api.GetDisplayNameOf(ssfSENDTO, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
		}
	});
}
