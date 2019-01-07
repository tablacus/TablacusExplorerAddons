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
		strName: item.getAttribute("MenuName") || GetText("Add all tabs to favories..."),
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt)
		{
			GetFolderView(Ctrl, pt).Focus();
			var xml = te.Data.xmlMenus;
			var menus = xml.getElementsByTagName("Favorites");
			if (menus && menus.length) {
				var item = xml.createElement("Item");
				var s = InputDialog(GetText("Name"), "");
				if (s) {
					item.setAttribute("Name", s);
					item.setAttribute("Org", 1);
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
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.AddTabs2Fav.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.AddTabs2Fav.strName));
			ExtraMenuCommand[nPos] = Addons.AddTabs2Fav.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.AddTabs2Fav.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.AddTabs2Fav.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Add all tabs to favorite...", Addons.AddTabs2Fav.Exec);

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon") || h > 16 ? "bitmap:ieframe.dll,214,24,3" : "bitmap:ieframe.dll,216,16,3";
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.AddTabs2Fav.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.AddTabs2Fav.strName, src: s }, h), '</span>']);
} else {
	EnableInner();
}
