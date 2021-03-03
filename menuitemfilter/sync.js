const Addon_Id = "menuitemfilter";

Sync.MenuItemFilter = {
	Menus: {},

	Remove: function (hMenu, Menus, path) {
		for (let i = api.GetMenuItemCount(hMenu); i-- > 0;) {
			const s = api.GetMenuString(hMenu, i, MF_BYPOSITION).replace(/\t/g, "|");
			let hSubMenu = api.GetSubMenu(hMenu, i);
			for (let j in Menus) {
				if (PathMatchEx(path, Menus[j][0]) && PathMatchEx(s, Menus[j][1])) {
					api.DeleteMenu(hMenu, i, MF_BYPOSITION);
					hSubMenu = 0;
					break;
				}
			}
			if (hSubMenu) {
				Sync.MenuItemFilter.Remove(hSubMenu, Menus, path);
			}
		}
	}
};
try {
	const ado = api.CreateObject("ads");
	ado.CharSet = "utf-8";
	ado.Open();
	ado.LoadFromFile(BuildPath(te.Data.DataFolder, "config\\" + Addon_Id + ".tsv"));
	while (!ado.EOS) {
		const ar = ado.ReadText(adReadLine).split("\t");
		ar[1] = ar[1].replace(/\|/g, "\t");
		const s = ar.shift();
		if (s) {
			if (!Sync.MenuItemFilter.Menus[s]) {
				Sync.MenuItemFilter.Menus[s] = [];
			}
			Sync.MenuItemFilter.Menus[s].push(ar);
		}
	}
	ado.Close();
} catch (e) { }

AddEvent("Menus", function (Ctrl, hMenu, nPos, Selected, SelItem, ContextMenu, Name, pt) {
	if (api.GetKeyState(VK_SHIFT) >= 0) {
		Sync.MenuItemFilter.Remove(hMenu, Sync.MenuItemFilter.Menus[Name], api.GetDisplayNameOf(SelItem || GetFolderView(Ctrl, pt), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
	}
	return nPos;
});
