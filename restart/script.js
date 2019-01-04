var Addon_Id = "restart";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);
}

if (window.Addon == 1) {
	Addons.Restart =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function ()
		{
			SaveConfig();
			te.Reload(true);
			return S_OK;
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.Restart.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.Restart.strName);
			ExtraMenuCommand[nPos] = Addons.Restart.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Restart.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Restart.Exec, "Func");
	}
	AddTypeEx("Add-ons", "Restart", Addons.Restart.Exec);

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Restart.Exec()" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.Restart.strName, src: item.getAttribute("Icon") }, h), '</span>']);
} else {
	EnableInner();
}
