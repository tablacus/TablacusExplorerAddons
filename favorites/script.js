const Addon_Id = "favorites";
const Default = "ToolBar2Left";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Favorites = {
		sName: item.getAttribute("MenuName") || await GetText("Favorites"),

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
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
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("Favorites", Addons.Favorites.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Favorites.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Favorites.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Favorites.Exec(this);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: Addons.Favorites.sName,
			src: item.getAttribute("Icon") || "icon:general,2"
		}, GetIconSizeEx(item)), '</span>']);
	});
} else {
	EnableInner();
}
