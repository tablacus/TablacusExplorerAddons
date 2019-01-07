var Addon_Id = "switchhidden";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "View");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.SwitchHidden =
	{
		strName: item.getAttribute("MenuName") || api.LoadString(hShell32, 12856),
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			FV.ViewFlags ^= CDB2GVF_SHOWALLFILES;
			FV.Refresh();
			return S_OK;
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, SelItem, ContextMenu, Name, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			api.InsertMenu(hMenu, Addons.SwitchHidden.nPos, MF_BYPOSITION | MF_STRING | (FV.ViewFlags & CDB2GVF_SHOWALLFILES ? MF_CHECKED : 0), ++nPos, GetText(Addons.SwitchHidden.strName));
			ExtraMenuCommand[nPos] = Addons.SwitchHidden.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SwitchHidden.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SwitchHidden.Exec, "Func");
	}
	AddTypeEx("Add-ons", "Switch hidden items", Addons.SwitchHidden.Exec);

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.SwitchHidden.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.SwitchHidden.strName, src: item.getAttribute("Icon") }, h), '</span>']);
} else {
	EnableInner();
}
