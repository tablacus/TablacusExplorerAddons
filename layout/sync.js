const Addon_Id = "layout";
const item = GetAddonElement(Addon_Id);

Sync.Layout = {
	Exec: function (Ctrl, pt) {
		const folder = item.getAttribute("Menu") || BuildPath(te.Data.DataFolder, "layout");
		const Items = GetFileList(BuildPath(folder, "*.xml"));
		const hMenu = api.CreatePopupMenu();
		for (let i = 0; i < Items.length; ++i) {
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, i + 1, Items[i].replace(/\.xml$/i, ""));
		}
		if (!pt) {
			pt = api.GetCursorPos();
		}
		const nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
		api.DestroyMenu(hMenu);
		if (nVerb) {
			LoadXml(BuildPath(folder, Items[nVerb - 1]));
		}
		return S_OK;
	}
};

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.Layout.nPos, MF_BYPOSITION | MF_STRING, ++nPos, item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name);
		ExtraMenuCommand[nPos] = Sync.Layout.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.Layout.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.Layout.Exec, "Func");
}
//Type
AddTypeEx("Add-ons", "Layout", Sync.Layout.Exec);
