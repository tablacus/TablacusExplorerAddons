const Addon_Id = "movecontentup";
const item = GetAddonElement(Addon_Id);

Sync.MoveContentUp = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	Exec: function (Ctrl, pt) {
		const wfd = api.Memory("WIN32_FIND_DATA");
		try {
			const arg = GetSelectedArray(Ctrl, pt, true);
			const Selected = arg[0];
			if (!Selected || !Selected.Count || !confirmOk()) {
				return;
			}
			const fFlags = api.GetKeyState(VK_SHIFT) < 0 ? 0 : FOF_ALLOWUNDO;
			const ar = [];
			const arItems = [];
			for (let i = Selected.Count; i-- > 0;) {
				const Item = Selected.Item(i);
				if (Item.IsFolder) {
					api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size);
					if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
						const Items1 = Item.GetFolder.Items();
						for (let j = Items1.Count; j-- > 0;) {
							arItems.unshift(Items1.Item(j).Path);
						}
						ar.push(Item);
					}
				}
			}
			if (arItems.length) {
				api.SHFileOperation(FO_MOVE, arItems, arg[2].FolderItem.Path, fFlags, false);
				arItems.length = 0;
				for (let i = ar.length; i--;) {
					if (ar[i].GetFolder.Items().Count == 0) {
						arItems.unshift(ar[i].Path);
					}
				}
				if (arItems.length) {
					api.SHFileOperation(FO_DELETE, arItems, null, fFlags | FOF_NOCONFIRMATION, true);
				}
			}
		} catch (e) {
			MessageBox([(e.description || e.toString()), s].join("\n"), TITLE, MB_OK);
		}
		return S_OK;
	}
}
//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		if (item && item.IsFileSystem && item.IsFolder) {
			const wfd = api.Memory("WIN32_FIND_DATA");
			api.SHGetDataFromIDList(item, SHGDFIL_FINDDATA, wfd, wfd.Size);
			if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
				api.InsertMenu(hMenu, Sync.MoveContentUp.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.MoveContentUp.strName);
				ExtraMenuCommand[nPos] = Sync.MoveContentUp.Exec;
			}
		}
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.MoveContentUp.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.MoveContentUp.Exec, "Func");
}
AddTypeEx("Add-ons", "Move content up", Sync.MoveContentUp.Exec);
