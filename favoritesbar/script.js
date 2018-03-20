var Addon_Id = "favoritesbar";

if (window.Addon == 1) {
	Addons.FavoritesBar =
	{
		Align: api.StrCmpI(GetAddonOption(Addon_Id, "Align"), "Right") ? "Left" : "Right",
		arExpand: GetAddonOptionEx("favoritesbar", "Expanded") ? [BUTTONS.opened, ''] : [BUTTONS.closed, ' style="display: none"'],
		Height: GetAddonOption(Addon_Id, "Height") || '100%',

		Init: function ()
		{
			if (!te.Data["Conf_" + this.Align + "BarWidth"]) {
				te.Data["Conf_" + this.Align + "BarWidth"] = 178;
			}
			this.Width = te.Data["Conf_" + this.Align + "BarWidth"];
			SetAddon(Addon_Id, this.Align + "Bar2", ['<div id="favoritesbar" style="width: 100%; height:', EncodeSC(Addons.FavoritesBar.Height), '; background-color: window; border: 1px solid WindowFrame; overflow: auto;">']);
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
					var path = this.GetPath(items, i);
					var ContextMenu = api.ContextMenu(path);
					if (ContextMenu) {
						ContextMenu.QueryContextMenu(hMenu, 0, 0x1001, 0x7FFF, CMF_DEFAULTONLY);
						RemoveCommand(hMenu, ContextMenu, "delete;rename");
						api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
						api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 3, api.LoadString(hShell32, 31368));
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
					if (nVerb == 3) {
						this.OpenContains(path);
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
				var image = te.WICBitmap;
				for (var i = 0; i < items.length; i++) {
					var strName = items[i].getAttribute("Name");
					if (!items[i].getAttribute("Org")) {
						strName = GetText(strName);
					}		
					var strType = items[i].getAttribute("Type");
					var img = EncodeSC(items[i].getAttribute("Icon"));
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
						s.splice(s.length, 0, '<div style="width: 90%; width: calc(100% - 8px); height: 3px; background-color: ActiveBorder; border: 1px solid window; font-size: 1px"></div>');
						continue;
					}
					path = Addons.FavoritesBar.GetPath(items, i);
					if (nOpen) {
						img = '<a id="fav' + i + '_button" class="treebutton">' + Addons.FavoritesBar.arExpand[0] + '</a><img src="' + EncodeSC(img || MakeImgSrc("icon:shell32.dll,3,16", 0, false, 16)) + '" class="favicon">';
					} else if (img) {
						img = '<img src="' + EncodeSC(img) + '" class="favicon">';
					} else if (api.PathMatchSpec(strType, "Open;Open in New Tab;Open in Background;Exec")) {
						var pidl = api.ILCreateFromPath(path);
						if (api.ILIsEmpty(pidl) || pidl.Unavailable) {
							var res = /"([^"]*)"/.exec(path) || /([^ ]*)/.exec(path);
							if (res) {
								pidl = api.ILCreateFromPath(res[1]);
							}
						}
						img = '<img src="' + GetIconImage(pidl, GetSysColor(COLOR_WINDOW)) + '" class="favicon">';
					} else {
						img = '<img src="' + MakeImgSrc("icon:shell32.dll,0,16", 0, false, 16) + '" class="favicon">';
					}
					s.splice(s.length, 0, '<div id="fav', i, '" onclick="Addons.FavoritesBar.Open(', i, ')" oncontextmenu="Addons.FavoritesBar.Popup(' + i + '); return false" onmousedown="return Addons.FavoritesBar.Down(', i, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="', EncodeSC(items[i].text), '" style="width: 100%">', new Array(nLevel + (nOpen ? 1 : 2)).join('<span class="treespace">' + BUTTONS.opened + '</span>'), img, " ", EncodeSC(strName.replace(/\\t.*$/g, "").replace(/&(.)/g, "$1")), '</div> ');
					if (nOpen) {
						s.push(api.sprintf(99, '<div id="fav%d_"%s>', i, Addons.FavoritesBar.arExpand[1]));
						nLevel++;
					}
				}
			}
			document.getElementById("favoritesbar").innerHTML = s.join("");
		},

		Changed: function () {
			Addons.FavoritesBar.Arrange();
			ApplyLang(document.getElementById("favoritesbar"));
		},

		ShowOptions: function (i)
		{
			ShowOptions("Tab=Menus&Menus=Favorites" + (isFinite(i) ? "," + i : ""));
		},

		OpenContains: function (path)
		{
			Navigate(fso.GetParentFolderName(path), SBSP_NEWBROWSER);
			setTimeout(function ()
			{
				FV = te.Ctrl(CTRL_FV);
				FV.SelectItem(path, SVSI_SELECT | SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_NOTAKEFOCUS);
			}, 99);
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

	AddEvent("Resize", function ()
	{
		var w = te.Data["Conf_" + Addons.FavoritesBar.Align + "BarWidth"];
		Addons.FavoritesBar.Width = w;
		document.getElementById('favoritesbar').style.width = w + "px";
	});

	AddEvent("FavoriteChanged", Addons.FavoritesBar.Changed);
	Addons.FavoritesBar.Init();
}
