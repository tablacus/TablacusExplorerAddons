Addon_Id = "favoritesbar";

if (window.Addon == 1) {
	Addons.FavoritesBar =
	{
		Align: api.StrCmpI(GetAddonOption(Addon_Id, "Align"), "Right") ? "Left" : "Right",
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
				if (api.StrCmpI(type, "Open") == 0) {
					if (api.GetKeyState(VK_CONTROL) < 0 || GetAddonOption("favoritesbar", "NewTab")) {
						type = "Open in New Tab";
					}
				}
				if (api.StrCmpI(type, "Menus") == 0) {
					var o = document.getElementById("fav" + i + "_button");
					var oChild = document.getElementById("fav" + i + "_");
					if (oChild.style.display == "none") {
						o.innerHTML = BUTTONS.opened;
						oChild.style.display = "block";
					} else {
						o.innerHTML = BUTTONS.closed;
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
					return false;
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
						ContextMenu.QueryContextMenu(hMenu, 0, 0x1001, 0x7FFF, CMF_DEFAULTONLY);
						RemoveCommand(hMenu, ContextMenu, "delete;rename");
						api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
					}
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("&Edit"));
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, GetText("Add"));
					var pt = api.Memory("POINT");
					api.GetCursorPos(pt);
					var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu);
					if (nVerb >= 0x1001) {
						var s = ContextMenu.GetCommandString(nVerb - 0x1001, GCS_VERB);
						if (api.StrCmpI(s, "delete")) {
							ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 0x1001, null, null, SW_SHOWNORMAL, 0, 0);
						} else {
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
					var img = items[i].getAttribute("Icon") || "";
					var path = items[i].text;
					var nOpen = 0;
					if (api.StrCmpI(strType, "Menus") == 0) {
						if (api.StrCmpI(path, "Open") == 0) {
							nOpen = 1;
						} else if (api.StrCmpI(path, "Close") == 0) {
							s.push('</div>');
							nLevel && nLevel--;
							continue;
						} else {
							strName = "-";
						}
					}
					if (strName == "-") {
						s.splice(s.length, 0, '<div style="width: ', this.Width - 8, 'px; height: 3px; background-color: ActiveBorder; border: 1px solid window; font-size: 1px"></div>');
						continue;
					}
					path = Addons.FavoritesBar.GetPath(items, i);
					if (img) {
						img = '<img src="' + MakeImgSrc(img, 0, false, 16) + '" />';
					} else if (nOpen) {
						img = '<a id="fav' + i + '_button" class="treebutton">' + BUTTONS.opened + '</a><img src="' + MakeImgSrc("icon:shell32.dll,3,16", 0, false, 16) + '">';
					} else if (api.PathMatchSpec(strType, "Open;Open in New Tab;Open in Background;Exec")) {
						var pidl = api.ILCreateFromPath(path);
						if (api.ILIsEmpty(pidl) || pidl.Unavailable) {
							var res = /"([^"]*)"/.exec(path) || /([^ ]*)/.exec(path);
							if (res) {
								pidl = api.ILCreateFromPath(res[1]);
							}
						}
						img = '<img src="' + GetIconImage(pidl, GetSysColor(COLOR_WINDOW)) + '">';
					} else {
						img = '<img src="' + MakeImgSrc("icon:shell32.dll,0,16", 0, false, 16) + '">';
					}
					s.splice(s.length, 0, '<div id="fav', i, '" onclick="Addons.FavoritesBar.Open(', i, ')" oncontextmenu="Addons.FavoritesBar.Popup(' + i + '); return false" onmousedown="return Addons.FavoritesBar.Down(', i, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="', items[i].text.replace(/"/g, "&quot;"), '" style="width: 100%">', new Array(nLevel + (nOpen ? 1 : 2)).join('<span class="treespace">' + BUTTONS.opened + '</span>'), img, " ", strName.replace(/&/g, ""), '</div> ');
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
					if (hr == S_OK && pdwEffect[0]) {
						MouseOver(document.getElementById("fav" + i));
					}
					return S_OK;
				}
			}
			if (HitTest(document.getElementById("favoritesbar"), pt) && dataObj.Count) {
				pdwEffect[0] = DROPEFFECT_LINK;
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

	AddEvent("DragLeave", function (Ctrl)
	{
		MouseOut();
		return S_OK;
	});

	AddEvent("FavoriteChanged", Addons.FavoritesBar.Arrange);
	Addons.FavoritesBar.Init();
}
