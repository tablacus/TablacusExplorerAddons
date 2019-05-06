Addon_Id = "menuitemfilter";

if (window.Addon == 1) {
	Addons.MenuItemFilter = {
		Menus: {},

		Remove: function (hMenu, Menus, path)
		{
			for (var i = api.GetMenuItemCount(hMenu); i-- > 0;) {
				var s = api.GetMenuString(hMenu, i, MF_BYPOSITION).replace(/\t/g, "|");
				var hSubMenu = api.GetSubMenu(hMenu, i);
				for (var j in Menus) {
					if (PathMatchEx(path, Menus[j][0]) && PathMatchEx(s, Menus[j][1])) {
						api.DeleteMenu(hMenu, i, MF_BYPOSITION);
						hSubMenu = 0;
						break;
					}
				}
				if (hSubMenu) {
					Addons.MenuItemFilter.Remove(hSubMenu, Menus, path);
				}
			}
		}
	};
	try {
		var ado = api.CreateObject("ads");
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\" + Addon_Id + ".tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			ar[1] = ar[1].replace(/\|/g, "\t");
			var s = ar.shift();
			if (s) {
				if (!Addons.MenuItemFilter.Menus[s]) {
					Addons.MenuItemFilter.Menus[s] = [];
				}
				Addons.MenuItemFilter.Menus[s].push(ar);
			}
		}
		ado.Close();
	} catch (e) {}

	AddEvent("Menus", function (Ctrl, hMenu, nPos, Selected, SelItem, ContextMenu, Name, pt)
	{
		Addons.MenuItemFilter.Remove(hMenu, Addons.MenuItemFilter.Menus[Name], api.GetDisplayNameOf(SelItem || GetFolderView(Ctrl, pt), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
		return nPos;
	});
}
