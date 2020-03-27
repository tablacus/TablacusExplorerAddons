var Addon_Id = "switchhiddenfilter";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "View");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.SwitchHiddenFilter =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt) {
			te.UseHiddenFilter = !te.UseHiddenFilter;
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				FV.Refresh();
			}
			return S_OK;
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, SelItem, ContextMenu, Name, pt) {
			var FV = GetFolderView(Ctrl, pt);
			api.InsertMenu(hMenu, Addons.SwitchHiddenFilter.nPos, MF_BYPOSITION | MF_STRING | (te.UseHiddenFilter ? MF_CHECKED : 0), ++nPos, GetText(Addons.SwitchHiddenFilter.strName));
			ExtraMenuCommand[nPos] = Addons.SwitchHiddenFilter.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SwitchHiddenFilter.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SwitchHiddenFilter.Exec, "Func");
	}
	AddTypeEx("Add-ons", "Switch hidden filter", Addons.SwitchHiddenFilter.Exec);

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.SwitchHiddenFilter.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.SwitchHiddenFilter.strName, src: item.getAttribute("Icon") }, h), '</span>']);
} else {
	EnableInner();
}
