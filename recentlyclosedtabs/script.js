var Addon_Id = "recentlyclosedtabs";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.RecentlyClosedTabs =
	{
		nPos: 0,
		strName: "",
		nCommand: 1,

		Exec: function (Ctrl, pt)
		{
			GetFolderView(Ctrl, pt).Focus();
			if (!pt) {
				pt = api.Memory("POINT");
				api.GetCursorPos(pt);
			}
			Addons.RecentlyClosedTabs.nCommand = 1;
			var hMenu = Addons.RecentlyClosedTabs.CreateMenu();
			Addons.RecentlyClosedTabs.MenuCommand(Ctrl, pt, "", api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null), hMenu);
			api.DestroyMenu(hMenu);
			return S_OK;
		},

		Popup: function ()
		{
			return false;
		},

		MenuCommand: function (Ctrl, pt, Name, nVerb, hMenu)
		{
			nVerb -= Addons.RecentlyClosedTabs.nCommand;
			if (nVerb >= 0) {
				Addons.UndoCloseTab.Open(GetFolderView(Ctrl, pt), nVerb);
				return S_OK;
			}
		},

		CreateMenu: function ()
		{
			var hMenu = api.CreatePopupMenu();
			var db = {};
			if (Addons.UndoCloseTab && Addons.UndoCloseTab.Get) {
				var seed = new Date().getTime();
				for (var i = 0; i < Addons.UndoCloseTab.db.length; i++) {
					var Items = Addons.UndoCloseTab.Get(i);
					s = [seed];
					for (var j = Items.length; j--;) {
						s.unshift(api.PathQuoteSpaces(api.GetDisplayNameOf(Items.Item(j), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL)));
					}
					s = api.CRC32(s.join(" "));
					var Item = Items.Item(Items.Index);
					if (Item && !db[s]) {
						db[s] = 1;
						var mii = api.Memory("MENUITEMINFO");
						mii.cbSize = mii.Size;
						mii.fMask = MIIM_STRING | MIIM_ID | MIIM_BITMAP;
						AddMenuIconFolderItem(mii, Item);
						var s = api.GetDisplayNameOf(Item, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
						if (Items.Count > 1) {
							s += "...\t" + Items.Count;
						}
						mii.dwTypeData = s;
						mii.wId = i + this.nCommand;
						api.InsertMenuItem(hMenu, MAXINT, true, mii);
					}
				}
			}
			return hMenu;
		}
	};
	if (item) {
		var s = item.getAttribute("MenuName");
		if (!s || s == "") {
			var info = GetAddonInfo(Addon_Id);
			s = info.Name;
		}
		Addons.RecentlyClosedTabs.strName = GetText(s);
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.RecentlyClosedTabs.nPos = api.LowPart(item.getAttribute("MenuPos"));
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
			{
				if (Addons.UndoCloseTab && Addons.UndoCloseTab.db.length) {
					Addons.RecentlyClosedTabs.nCommand = nPos + 1;
					var mii = api.Memory("MENUITEMINFO");
					mii.cbSize = mii.Size;
					mii.fMask = MIIM_STRING | MIIM_SUBMENU;
					mii.dwTypeData = Addons.RecentlyClosedTabs.strName;
					mii.hSubMenu = Addons.RecentlyClosedTabs.CreateMenu();
					api.InsertMenuItem(hMenu, Addons.RecentlyClosedTabs.nPos, true, mii);
					AddEvent("MenuCommand", Addons.RecentlyClosedTabs.MenuCommand);
					nPos += Addons.UndoCloseTab.db.length;
				}
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.RecentlyClosedTabs.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.RecentlyClosedTabs.Exec, "Func");
		}
		AddTypeEx("Add-ons", "Recently closed tabs", Addons.RecentlyClosedTabs.Exec);
	}
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon") || "icon:dsuiext.dll,0";
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.RecentlyClosedTabs.Exec(this);" oncontextmenu="Addons.RecentlyClosedTabs.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.RecentlyClosedTabs.strName, src: s }, h), '</span>']);
} else {
	EnableInner();
}
