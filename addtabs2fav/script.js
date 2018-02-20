var Addon_Id = "addtabs2fav";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Favorites");
	item.setAttribute("MenuPos", 0);
	item.setAttribute("MenuName", "Add all tabs to favorites...");
}
if (window.Addon == 1) {
	Addons.AddTabs2Fav =
	{
		nPos: 0,
		strName: "Add all tabs to favories...",

		Exec: function ()
		{
			var xml = te.Data.xmlMenus;
			var menus = xml.getElementsByTagName("Favorites");
			if (menus && menus.length) {
				var item = xml.createElement("Item");
				var s = InputDialog(GetText("Name"), "");
				if (s) {
					item.setAttribute("Name", s);
					item.setAttribute("Filter", "");
					var TC = te.Ctrl(CTRL_TC);
					s = [];
					for (i in TC) {
						s.push(api.GetDisplayNameOf(TC[i].FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX));
					}
					item.text = s.join("\n");
					item.setAttribute("Type", "Open in Background");
					menus[0].appendChild(item);
					SaveXmlEx("menus.xml", xml);
				}
			}
			FavoriteChanged();
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
			Addons.AddTabs2Fav.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.AddTabs2Fav.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.AddTabs2Fav.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.AddTabs2Fav.strName));
				ExtraMenuCommand[nPos] = Addons.AddTabs2Fav.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), "Addons.AddTabs2Fav.Exec();", "JScript");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), "Addons.AddTabs2Fav.Exec();", "JScript");
		}
		
		AddTypeEx("Add-ons", "Add all tabs to favorite...", Addons.AddTabs2Fav.Exec);
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon") || h > 16 ? "bitmap:ieframe.dll,214,24,3" : "bitmap:ieframe.dll,216,16,3";
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.AddTabs2Fav.Exec();" oncontextmenu="Addons.AddTabs2Fav.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', '<img title="Add all tabs to favorite..." src="', EncodeSC(s), '" width="', h, 'px" height="', h, 'px" />', '</span>']);
}
