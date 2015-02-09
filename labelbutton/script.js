var Addon_Id = "labelbutton";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	Addons.LabelButton =
	{
		Exec: function (o, mode)
		{
			var pt;
			(function (o) { setTimeout(function () {
				MouseOver(o);
				if (Addons.Label) {
					var oList = {};
					Addons.Label.List(oList);
					var hMenu = api.CreatePopupMenu();
					var arList = [];
					for (var s in oList) {
						arList.push(s);
					}
					if (Addons.LabelButton.Add(hMenu, oList) && !mode && arList.length) {
						api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
					}
					if (mode) {
						pt = api.Memory("POINT");
						api.GetCursorPos(pt);
					}
					else {
						pt = GetPos(o);
						pt.x += screenLeft;
						pt.y += screenTop + o.offsetHeight;
						var i = 0;
						for (var s in oList) {
							api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, (++i) + 10000, s);
						}
					}
					Addons.LabelButton.Popup(hMenu, arList, pt)
				}
			}, 100);}) (o);
			return false;
		},

		Add: function (hMenu, oList)
		{
			var FV = te.Ctrl(CTRL_FV);
			if (FV) {
				Selected = FV.SelectedItems();
				if (Selected && Selected.Count) {
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("&Edit"));

					var mii = api.Memory("MENUITEMINFO");
					mii.cbSize = mii.Size;
					mii.fMask = MIIM_STRING | MIIM_SUBMENU | MIIM_STATE;
					mii.fState = MFS_DISABLED;
					mii.hSubMenu = api.CreatePopupMenu();
					mii.dwTypeData = GetText("Add");

					var mii2 = api.Memory("MENUITEMINFO");
					mii2.cbSize = mii.Size;
					mii2.fMask = MIIM_STRING | MIIM_SUBMENU | MIIM_STATE;
					mii2.fState = MFS_DISABLED;
					mii2.hSubMenu = api.CreatePopupMenu();
					mii2.dwTypeData = GetText("Remove");
					var oExists = {};
					for (var i = Selected.Count; i-- > 0;) {
						var path = api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORPARSING);
						if (path) {
							var ar = String(te.Labels[path] || "").split(/\s*;\s*/);
							for (var j in ar) {
								oExists[ar[j]] = 1;
							}
						}
					}
					i = 0;
					for (var s in oList) {
						api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++i + 20000, s);
						mii.fState = MFS_ENABLED;
						if (oExists[s]) {
							api.InsertMenu(mii2.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, i + 30000, s);
							mii2.fState = MFS_ENABLED;
						}
					}
					api.InsertMenuItem(hMenu, MAXINT, false, mii);
					api.InsertMenuItem(hMenu, MAXINT, false, mii2);
					return true;
				}
			}
		},

		Popup: function (hMenu, arList, pt)
		{
			window.g_menu_click = true;
			var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
			if (nVerb == 1) {
				Addons.Label.Edit(te.Ctrl(CTRL_FV), pt);
			}
			if (nVerb > 30000) {
				if (confirmOk("Are you sure?")) {
					Addons.Label.RemoveItems(Selected, arList[nVerb - 30001]);
				}
			}
			else if (nVerb > 20000) {
				if (confirmOk("Are you sure?")) {
					Addons.Label.AppendItems(Selected, arList[nVerb - 20001]);
				}
			}
			else if (nVerb > 10000) {
				Navigate("label:" + arList[nVerb - 10001], window.g_menu_button == 3 ? SBSP_NEWBROWSER : OpenMode);
			}
			api.DestroyMenu(hMenu);
		}
	};
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var src = GetAddonOption(Addon_Id, "Icon") || h <= 16 ? "../addons/label/label16.png" : "../addons/label/label32.png";
	var s = ['<span class="button" onclick="return Addons.LabelButton.Exec(this, 0);" oncontextmenu="return Addons.LabelButton.Exec(this, 1);" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="', api.PSGetDisplayName("System.Contact.Label"), '" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="' + h, 'px"></span>'];
	SetAddon(Addon_Id, Default, s);
}
