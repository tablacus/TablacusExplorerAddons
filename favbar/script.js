var Addon_Id = "favbar";
var Default = "ToolBar4Center";

if (window.Addon == 1) {
	Addons.FavBar =
	{
		Click: function (i)
		{
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var item = items[i];
				if (item) {
					Exec(te, item.text, item.getAttribute("Type"), te.hwnd, null);
				}
				return S_OK;
			}
		},

		Open: function (i)
		{
			if (Addons.FavBar.bClose) {
				return S_OK;
			}
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
				if (menus && menus.length) {
					var items = menus[0].getElementsByTagName("Item");
					var item = items[i];
					var hMenu = api.CreatePopupMenu();
					var arMenu = [];
					for (var j = items.length; --j > i;) {
						arMenu.unshift(j);
					}
					var o = document.getElementById("_favbar" + i);
					var pt = GetPos(o, true);
					pt.y += o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI;
					MakeMenus(hMenu, null, arMenu, items, te, pt);
					AdjustMenuBreak(hMenu);
					AddEvent("ExitMenuLoop", function () {
						Addons.FavBar.bClose = true;
						setTimeout("Addons.FavBar.bClose = false;", 100);
					});
					var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
					api.DestroyMenu(hMenu);
					if (nVerb > 0) {
						item = items[nVerb - 1];
						Exec(te, item.text, item.getAttribute("Type"), te.hwnd, null);
					}
					return S_OK;
				}
			}
		},

		Popup: function (i)
		{
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				if (i >= 0) {
					var hMenu = api.CreatePopupMenu();
					var ContextMenu = null;
					if (i < items.length) {
						var path = this.GetPath(items, i);
						if (path != "") {
							ContextMenu = api.ContextMenu(path);
						}
					}
					if (ContextMenu) {
						ContextMenu.QueryContextMenu(hMenu, 0, 0x1001, 0x7FFF, CMF_NORMAL);
						api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
					}
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("&Edit"));
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, GetText("Add"));
					var pt = api.Memory("POINT");
					api.GetCursorPos(pt);
					var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu);
					if (nVerb >= 0x1001) {
						var s = ContextMenu.GetCommandString(nVerb - 0x1001, GCS_VERB);
						if (api.strcmpi(s, "delete")) {
							ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 0x1001, null, null, SW_SHOWNORMAL, 0, 0);
						}
						else {
							this.ShowOptions();
						}
					}
					if (nVerb == 1) {
						this.ShowOptions(i);
					}
					if (nVerb == 2) {
						this.ShowOptions();
					}
					api.DestroyMenu(hMenu);
				}
			}
			return false;
		},

		Arrange: function ()
		{
			var s = [];
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				menus = 0;
				var image = te.GdiplusBitmap;
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					var strFlag = api.strcmpi(item.getAttribute("Type"), "Menus") ? "" : item.text;
					if (api.PathMatchSpec(strFlag, "Close") && menus) {
						menus--;
						continue;
					}
					var menus1 = menus;
					if (api.PathMatchSpec(strFlag, "Open")) {
						if (menus++) {
							continue;
						}
					}
					else if (menus) {
						continue;
					}
					var img = '';
					var icon = item.getAttribute("Icon");
					var height = String(GetAddonOption("favbar", "Size")).replace(/\D/, "") || window.IconSize || 24;;
					var sh = (height ? ' style="height:' + height + 'px"' : '');
					if (icon) {
						img = '<img src="' + (icon || "").replace(/"/g, "") + '"' + sh + '>';
					}
					else if (/Open/i.test(item.getAttribute("Type"))) {
						if (document.documentMode) { //IE8-
							var info = api.Memory("SHFILEINFO");
							var path = this.GetPath(items, i);
							var pidl = api.ILCreateFromPath(path);
							if (!pidl) {
								if (path.match(/"([^"]*)"/)) {
									pidl = api.ILCreateFromPath(RegExp.$1);
								}
								else if (path.match(/([^ ]*)/)) {
									pidl = api.ILCreateFromPath(RegExp.$1);
								}
							}
							if (pidl) {
								api.ShGetFileInfo(pidl, 0, info, info.Size, SHGFI_PIDL | SHGFI_ICON | (height > 16 ? 0 : SHGFI_SMALLICON));
								image.FromHICON(info.hIcon, api.GetSysColor(COLOR_BTNFACE));
								img = '<img src="' + image.DataURI("image/png" , info.hIcon) + '" ' + sh + ' /> ';
								api.DestroyIcon(info.hIcon);
							}
						}
						else {
							img = height > 16 ? '<img src="icon:shell32.dll,3,32" />' : '<img src="icon:shell32.dll,3,16" /> ';
						}
					}
					s.push('<span id="_favbar', i, '" ', api.strcmpi(item.getAttribute("Type"), "Menus") || api.strcmpi(item.text, "Open") ? 'onclick="Addons.FavBar.Click('
 : 'onmousedown="Addons.FavBar.Open(');
					s.push(i, ')" oncontextmenu="return Addons.FavBar.Popup(', i, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="', item.text.replace(/"/g, "&quot;"), '">', img, GetText(item.getAttribute("Name")), '</span> ');
				}
				s.push('&nbsp;</label>');

				document.getElementById('_favbar').innerHTML = s.join("");
				Resize();
			}
		},

		ShowOptions: function (i)
		{
			ShowOptions("Tab=Menus&Menus=Favorites" + (isFinite(i) ? "," + i : ""));
		},

		GetPath: function (items, i)
		{
			var line = items[i].text.split("\n");
			return api.PathUnquoteSpaces(ExtractMacro(null, line[0]));
		},

		FromPt: function (n, pt)
		{
			while (--n >= 0) {
				if (HitTest(document.getElementById("_favbar" + n), pt)) {
					return n;
				}
			}
			return -1;
		},

	};
	SetAddon(Addon_Id, Default, '<span id="_favbar"></span>');
	Addons.FavBar.Arrange();
}
else {
	document.getElementById("tab0").value = GetText("Icon");
	document.getElementById("panel0").innerHTML = ['<label>', GetText("Size"), '</label><br /><input type="text" name="Size" size="4" />px'].join("");
}
