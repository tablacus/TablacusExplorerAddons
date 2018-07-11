Addon_Id = "switchhidden";
Default = "None";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "View");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.SwitchHidden =
	{
		nPos: 0,
		strName: "",

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			FV.ViewFlags ^= CDB2GVF_SHOWALLFILES;
			FV.Refresh();
			return S_OK;
		},

		Popup: function ()
		{
			return false;
		}
	};
	if (items.length) {
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.SwitchHidden.nPos = api.LowPart(item.getAttribute("MenuPos"));
			Addons.SwitchHidden.strName = item.getAttribute("MenuName") || api.LoadString(hShell32, 12856);
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
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="' + Addons.SwitchHidden.strName + '" src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px" />';
	} else {
		s = Addons.SwitchHidden.strName;
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.SwitchHidden.Exec(this);" oncontextmenu="Addons.SwitchHidden.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s, '</span>']);
} else {
	EnableInner();
}

