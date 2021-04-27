const Addon_Id = "betweenfilesfolders";
const item = GetAddonElement(Addon_Id);

Sync.BetweenFilesFolders = {
	sName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const Items = FV.Items();
		const bFolder = !IsFolderEx(Items.Item(0));
		const nCount = Items.Count;
		let nIndex = Math.floor((nCount - 1) / 2);
		let nDiff = nIndex;
		while (nDiff) {
			if (bFolder ^ IsFolderEx(Items.Item(nIndex))) {
				nIndex += nDiff;
			} else {
				nIndex -= nDiff;
			}
			nDiff = Math.floor(nDiff / 2);
		}
		while (bFolder ^ IsFolderEx(Items.Item(nIndex))) {
			if (nIndex++ >= nCount) {
				break;
			};
		}
		FV.SelectItem(Items.Item(nIndex), SVSI_SELECT | SVSI_DESELECTOTHERS | SVSI_ENSUREVISIBLE | SVSI_FOCUSED);
		return S_OK;
	}
}
//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		api.InsertMenu(hMenu, Sync.BetweenFilesFolders.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.BetweenFilesFolders.sName);
		ExtraMenuCommand[nPos] = Sync.BetweenFilesFolders.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.BetweenFilesFolders.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.BetweenFilesFolders.Exec, "Func");
}
AddTypeEx("Add-ons", "Between files and folders", Sync.BetweenFilesFolders.Exec);
