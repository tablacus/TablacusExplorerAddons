var Addon_Id = "controlpanelbutton";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	Addons.ControlPanelButton = 
	{
		Open: function(o)
		{
			setTimeout(function () {
				MouseOver(o);
				var hMenu = api.CreatePopupMenu();
				var ns = sha.NameSpace("::{26EE0668-A00A-44D7-9371-BEB064C98683}") || sha.NameSpace(ssfCONTROLS);
				var Items = ns.Items();

				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask  = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
				for (var i = Items.Count; i-- > 0;) {
					mii.wID = i + 1;
					mii.dwTypeData = api.GetDisplayNameOf(Items.Item(i), SHGDN_INFOLDER);
					AddMenuIconFolderItem(mii, Items.Item(i));
					api.InsertMenuItem(hMenu, 0, false, mii);
				}
				var pt = GetPos(o);
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, screenLeft + pt.x, screenTop + pt.y + o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI, te.hwnd, null);
				api.DestroyMenu(hMenu);
				MouseOut();
				if (nVerb) {
					Items.Item(nVerb - 1).InvokeVerb();
				}
			}, 100);
		}
	}

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var src =  ExtractMacro(te, GetAddonOption(Addon_Id, "Icon")) || (h <= 16 ? "icon:shell32.dll,21,16" : "icon:shell32.dll,21,32");
	var s = ['<span class="button" onmousedown="Addons.ControlPanelButton.Open(this); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="Control Panel" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="', h, 'px"></span>'];
	SetAddon(Addon_Id, Default, s);
}
