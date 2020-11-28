var Addon_Id = "addfavorites";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	const item = await GetAddonElement(Addon_Id);
	//Menu
	if (item.getAttribute("MenuExec")) {
		Common.AddFavorites = await api.CreateObject("Object");
		Common.AddFavorites.strMenu = item.getAttribute("Menu");
		Common.AddFavorites.strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
		Common.AddFavorites.nPos = GetNum(item.getAttribute("MenuPos"));
		$.importScript("addons\\" + Addon_Id + "\\sync.js");
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), AddFavoriteEx, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), AddFavoriteEx, "Func");
	}
	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,3" : "bitmap:ieframe.dll,214,24,3");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="AddFavoriteEx(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: src }, h), '</span>']);
} else {
	EnableInner();
}
