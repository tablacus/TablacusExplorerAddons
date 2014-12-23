var Addon_Id = "favoritesbar";

if (window.Addon == 1) {
	Addons.FavoritesBar =
	{
		AddFavorite: window.AddFavorite,
		Align: api.strcmpi(GetAddonOption(Addon_Id, "Align"), "Right") ? "Left" : "Right",
		Width: 0,

		Init: function ()
		{
			this.Width = te.Data["Conf_" + this.Align + "BarWidth"];
			if (!this.Width) {
				this.Width = 178;
				te.Data["Conf_" + this.Align + "BarWidth"] = this.Width;
			}
			SetAddon(Addon_Id, this.Align + "Bar2", ['<div id="favoritesbar" style="width: ', this.Width, 'px; height: 100%; background-color: window; border: 1px solid WindowFrame; overflow-x: hidden; overflow-y: auto;">']);
			this.Arrange();
		},

		Open: function (i)
		{
			var menus = te.Data.xmlMenus.getElementsByTagName("Favorites");
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var item = items[i];
				var type = item.getAttribute("Type");
				if (api.strcmpi(type, "Open") == 0) {
					if (api.GetKeyState(VK_CONTROL) < 0 || GetAddonOption("favoritesbar", "NewTab")) {
						type = "Open in New Tab";
					}
				}
				if (api.strcmpi(type, "Menus") == 0) {
					var o = document.getElementById("fav" + i + "_button");
					var oChild = document.getElementById("fav" + i + "_");
					if (api.strcmpi(o.innerText, "-")) {
						o.innerText = "-";
						oChild.style.display = "block";
					}
					else {
						o.innerText = "+";
						oChild.style.display = "none";
					}
					return;
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
		},

		Arrange: function ()
		{
			var s = [];
			var nLevel = 0;
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var image = te.GdiplusBitmap;
				for (var i = 0; i < items.length; i++) {
					var strName = GetText(items[i].getAttribute("Name"));
					var strType = items[i].getAttribute("Type");
					var path = items[i].text;
					var nOpen = 0;
					if (api.strcmpi(strType, "Menus") == 0) {
						if (api.strcmpi(path, "Open") == 0) {
							nOpen = 1;
						}
						else if (api.strcmpi(path, "Close") == 0) {
							s.push('</div>');
							nLevel && nLevel--;
							continue;
						}
						else {
							strName = "-";
						}
					}
					if (strName == "-") {
						s.splice(s.length, 0, '<div style="width: ', this.Width - 8, 'px; height: 3px; background-color: ActiveBorder; border: 1px solid window; font-size: 1px"></div>');
						continue;
					}
					path = this.GetPath(items, i);
					if (nOpen) {
						img = '<span id="fav' + i + '_button" class="treebutton">-</span>';
					}
					else {
						var img = '';
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
					}
					s.splice(s.length, 0, '<div id="fav', i, '" onclick="Addons.FavoritesBar.Open(', i, ')" oncontextmenu="Addons.FavoritesBar.Popup(' + i + '); return false" onmousedown="Addons.FavoritesBar.Down(', i, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="', items[i].text.replace(/"/g, "&quot;"), '" style="width: 100%">', new Array(nLevel + 1).join("&nbsp"), img, " ", strName.replace(/&/g, ""), '</div> ');
					if (nOpen) {
						s.push(api.sprintf(99, '<div id="fav%d_">', i));
						nLevel++;
					}
				}
			}
			document.getElementById("favoritesbar").innerHTML = s.join("");
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
				if (HitTest(document.getElementById("fav" + n), pt)) {
					return n;
				}
			}
			return -1;
		}

	};
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
