const Addon_Id = "selectedtotop";
const item = GetAddonElement(Addon_Id);

Sync.SelectedToTop = {
	sName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const Selected = FV.Items(SVGIO_SELECTION | SVGIO_FLAG_VIEWORDER);
		const Progress = api.CreateObject("ProgressDialog");
		Progress.StartProgressDialog(te.hwnd, null, 2);
		const Name = GetText("Selected items");
		try {
			FV.SelectItem(null, SVSI_DESELECTOTHERS);
			const IconSize = FV.IconSize;
			const ViewMode = api.SendMessage(FV.hwndList, LVM_GETVIEW, 0, 0);
			if (ViewMode == 1 || ViewMode == 3) {
				api.SendMessage(FV.hwndList, LVM_SETVIEW, 4, 0);
			}
			const FolderFlags = FV.FolderFlags;
			FV.FolderFlags = FolderFlags | FWF_AUTOARRANGE;
			FV.GroupBy = "System.Null";
			const pt2 = api.Memory("POINT");
			FV.GetItemPosition(FV.Item(0), pt2);
			const nMax = Selected.Count;
			Progress.SetLine(1, api.LoadString(hShell32, 50690) + " " + Name, true);
			for (let i = 0; !Progress.HasUserCancelled(i, nMax, 2) && i < nMax; ++i) {
				FV.SelectAndPositionItem(Selected.Item(nMax - i - 1), SVSI_DESELECT, pt2);
			}
			FV.SelectItem(Selected, SVSI_SELECT | SVSI_FOCUSED);
			api.SendMessage(FV.hwndList, LVM_SETVIEW, ViewMode, 0);
			FV.FolderFlags = FolderFlags;
			FV.IconSize = IconSize;
		} catch (e) { }
		Progress.StopProgressDialog();
		return S_OK;
	}
}
//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		api.InsertMenu(hMenu, Sync.SelectedToTop.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.SelectedToTop.sName);
		ExtraMenuCommand[nPos] = Sync.SelectedToTop.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.SelectedToTop.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.SelectedToTop.Exec, "Func");
}
AddTypeEx("Add-ons", "Selected to top", Sync.SelectedToTop.Exec);
