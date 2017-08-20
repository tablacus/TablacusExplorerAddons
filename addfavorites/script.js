var Addon_Id = "addfavorites";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	Addons.AddFavorites =
	{
		Exec: function (Ctrl, pt) {
			AddFavorite();
			return S_OK;
		}
	};

	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.AddFavorites.nPos = api.LowPart(item.getAttribute("MenuPos"));
			Addons.AddFavorites.strName = item.getAttribute("MenuName") || "Add Favorite";
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.AddFavorites.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.AddFavorites.strName));
				ExtraMenuCommand[nPos] = Addons.AddFavorites.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.AddFavorites.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.AddFavorites.Exec, "Func");
		}
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize;
	var src = GetAddonOption(Addon_Id, "Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,3" : "bitmap:ieframe.dll,214,24,3");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="AddFavorite();" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="Add Favorite" src="', src, '" style="width:', h, 'px; height:', h, 'px"></span>']);
}
