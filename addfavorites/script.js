var Addon_Id = "addfavorites";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);

	Addons.AddFavorites =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),
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
				ExtraMenuCommand[nPos] = AddFavoriteEx;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), AddFavoriteEx, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), AddFavoriteEx, "Func");
		}
	}
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,3" : "bitmap:ieframe.dll,214,24,3");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="AddFavoriteEx(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.AddFavorites.strName,  src: src }, h), '</span>']);
} else {
	EnableInner();
}
