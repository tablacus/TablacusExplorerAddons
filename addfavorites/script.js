const Addon_Id = "addfavorites";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	let item = await GetAddonElement(Addon_Id);
	//Menu
	const strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("AddFavorites", strName, item.getAttribute("Menu"), item.getAttribute("MenuPos"), "AddFavoriteEx");
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), AddFavoriteEx, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), AddFavoriteEx, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="AddFavoriteEx(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: strName,
			src: item.getAttribute("Icon") || "icon:general,3"
		}, GetIconSizeEx(item)), '</span>']);
		delete item;
	});
} else {
	EnableInner();
}
