var Addon_Id = "recentlyclosedtabs";
var Default = "ToolBar2Left";

var item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.RecentlyClosedTabs = {
		Exec: async function (Ctrl, pt) {
			var FV = await GetFolderView(Ctrl, pt);
			FV.Focus();
			if (!pt) {
				pt = await api.Memory("POINT");
				await api.GetCursorPos(pt);
			}
			Common.RecentlyClosedTabs.nCommand = 1;
			var hMenu = await Addons.RecentlyClosedTabs.CreateMenu();
			Addons.RecentlyClosedTabs.MenuCommand(Ctrl, pt, "", await api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y, await te.hwnd, null, null), hMenu);
			api.DestroyMenu(hMenu);
			return S_OK;
		},

		ExecEx: async function (el) {
			Addons.RecentlyClosedTabs.Exec(await GetFolderViewEx(el));
		},

		MenuCommand: async function (Ctrl, pt, Name, nVerb, hMenu) {
			nVerb -= await Common.RecentlyClosedTabs.nCommand;
			if (nVerb >= 0) {
				Sync.UndoCloseTab.Open(await GetFolderView(Ctrl, pt), nVerb);
				return S_OK;
			}
		},

		CreateMenu: async function () {
			var hMenu = await api.CreatePopupMenu();
			var db = {};
			if (Addons.UndoCloseTab && await Sync.UndoCloseTab.Get) {
				var seed = new Date().getTime();
				var nLen = await GetLength(await Common.UndoCloseTab.db);
				for (var i = 0; i < nLen; i++) {
					var Items = await Sync.UndoCloseTab.Get(i);
					s = [seed];
					for (var j = await GetLength(Items); j--;) {
						s.unshift(await api.PathQuoteSpaces(await Items.Item(j).Path));
					}
					s = s.join(" ");
					var Item = await Items.Item(await Items.Index);
					if (Item && !db[s]) {
						db[s] = 1;
						var mii = await api.Memory("MENUITEMINFO");
						mii.cbSize = await mii.Size;
						mii.fMask = MIIM_STRING | MIIM_ID | MIIM_BITMAP;
						await AddMenuIconFolderItem(mii, Item);
						var s = await Item.Path;
						var nCount = await Items.Count;
						if (nCount > 1) {
							s += "...\t" + nCount;
						}
						mii.dwTypeData = s;
						mii.wId = i + await Common.RecentlyClosedTabs.nCommand;
						await api.InsertMenuItem(hMenu, MAXINT, true, mii);
					}
				}
			}
			return hMenu;
		}
	};
	Common.RecentlyClosedTabs = await api.CreateObject("Object");
	Common.RecentlyClosedTabs.nCommand = 1;
	//Menu
	if (item.getAttribute("MenuExec")) {
		Common.RecentlyClosedTabs.strMenu = item.getAttribute("Menu");
		Common.RecentlyClosedTabs.strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
		Common.FilterBar.nPos = GetNum(item.getAttribute("MenuPos"));
		importJScript("addons\\" + Addon_Id + "\\sync.js");
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.RecentlyClosedTabs.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.RecentlyClosedTabs.Exec, "Async");
	}
	AddTypeEx("Add-ons", "Recently closed tabs", Addons.RecentlyClosedTabs.Exec);
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon") || "icon:dsuiext.dll,0";
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.RecentlyClosedTabs.ExecEx(this);" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: s }, h), '</span>']);
} else {
	EnableInner();
}
