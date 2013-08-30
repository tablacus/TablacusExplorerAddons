var Addon_Id = "favoritesbar";
var Default = "LeftBar2";

if (window.Addon == 1) {
	Addons.FavoritesBar =
	{
		AddFavorite: window.AddFavorite,

		Init: function ()
		{
			SetAddon(Addon_Id, Default, '<div id="favoritesbar" style="width: ' + te.Data.Conf_LeftBarWidth + 'px; height: 100%; background-color: window; border: 1px solid WindowFrame; overflow-x: hidden; overflow-y: auto;">');
			this.Arrange();
		},

		Open: function (i)
		{
			var menus = te.Data.xmlMenus.getElementsByTagName("Favorites");
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var item = items[i];
				var type = item.getAttribute("Type");
				if (type == "Open") {
					if (api.GetKeyState(VK_CONTROL) < 0 || GetAddonOption("favoritesbar", "NewTab")) {
						type = "Open in New Tab";
					}
				}
				Exec(te, item.text, type, te.hwnd);
			}
		},

		Down: function (i)
		{
			if (api.GetKeyState(VK_MBUTTON) < 0) {
				var menus = te.Data.xmlMenus.getElementsByTagName("Favorites");
				if (menus && menus.length) {
					var items = menus[0].getElementsByTagName("Item");
					Exec(te, items[i].text, "Open in New Tab", te.hwnd);
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
					var ContextMenu = api.ContextMenu(this.GetPath(items, i));
					if (ContextMenu) {
						ContextMenu.QueryContextMenu(hMenu, 0, 0x1001, 0x7FFF, CMF_NORMAL);
						api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
					}
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("&Edit"));
					var pt = api.Memory("POINT");
					api.GetCursorPos(pt);
					var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu);
					if (nVerb >= 0x1001) {
						var s = ContextMenu.GetCommandString(nVerb - 0x1001, GCS_VERB);
						if (api.strcmpi(s, "delete")) {
							ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 0x1001, null, null, SW_SHOWNORMAL, 0, 0);
						}
						else {
							ShowOptions("Tab=Menus&Menus=Favorites");
						}
					}
					if (nVerb == 1) {
						ShowOptions("Tab=Menus&Menus=Favorites");
					}
					api.DestroyMenu(hMenu);
				}
			}
		},

		Arrange: function ()
		{
			var s = "";
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var image = te.GdiplusBitmap;
				for (var i = 0; i < items.length; i++) {
					var strName = GetText(items[i].getAttribute("Name"));
					if (strName == "-") {
						s += '<div style="width: ' + (te.Data.Conf_LeftBarWidth - 8) + 'px; background-color: ActiveBorder; border: 1px solid window; font-size: 1px"></div>';
					}
					else {
						var img = '';
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
							if (document.documentMode) { //IE8-
								var info = api.Memory("SHFILEINFO");
								api.ShGetFileInfo(pidl, 0, info, info.Size, SHGFI_PIDL | SHGFI_ICON | SHGFI_SMALLICON);
								image.FromHICON(info.hIcon, api.GetSysColor(COLOR_BTNFACE));
								img = '<img src="' + image.DataURI("image/png" , info.hIcon) + '">';
								api.DestroyIcon(info.hIcon);
							}
							else if (pidl.IsFolder) {
								img = '<img src="' + MakeImgSrc("", 0, false, 16, null, "shell32.dll,3,16") + '">';
							}
						}
						s += '<div id="fav' + i + '" onclick="Addons.FavoritesBar.Open(' + i + ')" oncontextmenu="Addons.FavoritesBar.Popup(' + i + '); return false" onmousedown="Addons.FavoritesBar.Down(' + i + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="' + items[i].text.replace(/"/g, "&quot;") + '" style="width: 100%">' + img + " " + strName.replace(/&/g, "") + '</div> ';
					}
				}
			}
			document.getElementById("favoritesbar").innerHTML = s;
		},

		GetPath: function (items, i)
		{
			var line = items[i].text.split("\n");
			return api.PathUnquoteSpaces(ExtractMacro(null, line[0]));
		},

		FromPt: function (n, pt)
		{
			while (--n >= 0) {
				if (HitTest(document.getElementById("fav" + n), pt)) {
					return n;
				}
			}
			return -1;
		}

	};
	if (!te.Data.Conf_LeftBarWidth) {
		te.Data.Conf_LeftBarWidth = 150;
	}
	Addons.FavoritesBar.Init();

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_WB) {
			return S_OK;
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_WB) {
			var menus = te.Data["xmlMenus"].getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var i = Addons.FavoritesBar.FromPt(items.length, pt);
				if (i >= 0) {
					hr = Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect);
					if (hr == S_OK && pdwEffect.x) {
						MouseOver(document.getElementById("fav" + i));
					}
					return S_OK;
				}
			}
			if (HitTest(document.getElementById("favoritesbar"), pt) && dataObj.Count) {
				pdwEffect.x = DROPEFFECT_LINK;
				return S_OK;
			}
		}
		MouseOut("fav");
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		MouseOut();
		if (Ctrl.Type == CTRL_WB) {
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var i = Addons.FavoritesBar.FromPt(items.length + 1, pt);
				if (i >= 0) {
					return Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect, true);
				}
			}
			if (HitTest(document.getElementById("favoritesbar"), pt) && dataObj.Count) {
				AddFavorite(dataObj.Item(0));
				return S_OK;
			}
		}
	});

	AddEvent("Dragleave", function (Ctrl)
	{
		MouseOut();
		return S_OK;
	});

	AddFavorite = function (o)
	{
		var r = false;
		if (Addons.FavoritesBar.AddFavorite) {
			r = Addons.FavoritesBar.AddFavorite(o);
		}
		if (r) {
			Addons.FavoritesBar.Arrange();
		}
		return r;
	}
}
