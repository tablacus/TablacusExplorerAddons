AddType("Send to", {
	Exec: function (Ctrl, s, type, hwnd, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const Selected = FV.SelectedItems();
		const DropTarget = api.DropTarget(s);
		if (Selected && Selected.Count && DropTarget) {
			const pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
			DropTarget.Drop(Selected, MK_LBUTTON, pt, pdwEffect);
		}
		return S_OK;
	},

	Ref: function (path) {
		return OpenDialog(path || api.GetDisplayNameOf(ssfSENDTO, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
	}
});
