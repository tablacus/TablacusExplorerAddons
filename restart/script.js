const Addon_Id = "restart";
const Default = "None";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);
}

if (window.Addon == 1) {
	Addons.Restart = {
		Exec: async function () {
			await SaveConfig();
			te.Reload(true);
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		Common.Restart = await api.CreateObject("Object");
		Common.Restart.strMenu = item.getAttribute("Menu");
		Common.Restart.strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
		Common.Restart.nPos = GetNum(item.getAttribute("MenuPos"));
		$.importScript("addons\\" + Addon_Id + "\\sync.js");
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Restart.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Restart.Exec, "Async");
	}
	AddTypeEx("Add-ons", "Restart", Addons.Restart.Exec);

	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Restart.Exec()" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: item.getAttribute("Icon") }, h), '</span>']);
} else {
	EnableInner();
}
