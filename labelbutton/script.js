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
					var oListPos = {};
					var i = 0;
					for (var s in oList) {
						arList.push(s);
						oListPos[s] = ++i;
					}
					if (Addons.LabelButton.Add(hMenu, oList, arList, oListPos) && !mode && arList.length) {
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
						var FV = te.Ctrl(CTRL_FV);
						if (FV && FV.CurrentViewMode == FVM_DETAILS) {
							if (!/"System\.Contact\.Label"/.test(FV.Columns(1))) {
								api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, GetText("Details"));
							}
						}
						var nRes = Addons.LabelButton.LabelGroup(hMenu, oList, arList, oListPos, 10000);
						for (var s in oList) {
							if (nRes) {
								api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
								nRes = 0;
							}
							api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, oListPos[s] + 10000, s);
						}
					}
					Addons.LabelButton.Popup(hMenu, arList, pt)
				}
			}, 100);}) (o);
			return false;
		},

		Add: function (hMenu, oList, arList, oListPos)
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
						var path = api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
						if (path) {
							var ar = Addons.Label.Get(path).split(/\s*;\s*/);
							for (var j in ar) {
								oExists[ar[j]] = 1;
							}
						}
					}
					for (var s in oList) {
						i = oListPos[s];
						if (oExists[s]) {
							api.InsertMenu(mii2.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, i + 30000, s);
							mii2.fState = MFS_ENABLED;
						}
					}
					var nRes = Addons.LabelButton.LabelGroup(mii.hSubMenu, oList, arList, oListPos, 20000);
					if (nRes) {
						mii.fState = MFS_ENABLED;
					}
					for (var s in oList) {
						if (nRes) {
							api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
							nRes = 0;
						}
						api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, oListPos[s] + 20000, s);
						mii.fState = MFS_ENABLED;
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
			if (nVerb == 2) {
				var FV = te.Ctrl(CTRL_FV);
				FV.Columns = FV.Columns + ' "System.Contact.Label" -1';
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
				Navigate("label:" + arList[nVerb - 10001], GetOpenMode());
			}
			api.DestroyMenu(hMenu);
		},

		LabelGroup: function (hMenu, oList, arList, oListPos, nOffset)
		{
			var nRes = 0;
			if (Addons.LabelGroups) {
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_STRING | MIIM_SUBMENU;
				var db = Addons.LabelGroups.db;
				for (var s in db) {
					mii.hSubMenu = api.CreatePopupMenu();
					mii.dwTypeData = s;
					var ar = db[s];
					for (var j in ar) {
						nRes++;
						var s1 = ar[j];
						if (!oListPos[s1]) {
							arList.push(s1);
							oListPos[s1] = arList.length;
						}
						api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, oListPos[s1] + nOffset, s1);
						delete oList[s1];
					}
					api.InsertMenuItem(hMenu, MAXINT, true, mii);
				}
			}
			return nRes;
		}
	};
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var src = GetAddonOption(Addon_Id, "Icon") || h <= 16 ? "../addons/label/label16.png" : "../addons/label/label32.png";
	var s = ['<span class="button" onclick="return Addons.LabelButton.Exec(this, 0);" oncontextmenu="return Addons.LabelButton.Exec(this, 1);" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="', api.PSGetDisplayName("System.Contact.Label"), '" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="' + h, 'px"></span>'];
	SetAddon(Addon_Id, Default, s);
}
