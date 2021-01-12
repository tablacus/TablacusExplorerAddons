const Addon_Id = "favorites";
const Default = "ToolBar2Left";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Favorites = {
		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderViewEx(Ctrl, pt);
			if (FV) {
				if (!pt) {
					if (await Ctrl.offsetHeight) {
						pt = await GetPosEx(Ctrl, 9);
					} else {
						pt = await api.Memory("POINT");
						await api.GetCursorPos(pt);
					}
				}
				FV.Focus();
				ExecMenu(te, "Favorites", pt, 0);
			}
		}
	};

	//Menu
	const strName = item.getAttribute("MenuName") || await GetText("Favorites");
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("Favorites", strName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Favorites.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Favorites.Exec, "Async");
	}
	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,2" : "bitmap:ieframe.dll,214,24,2");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Favorites.Exec(this);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: strName, src: src }, h), '</span>']);
} else {
	EnableInner();
}
