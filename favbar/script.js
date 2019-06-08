var Addon_Id = "favbar";
var Default = "ToolBar4Center";

if (window.Addon == 1) {
	Addons.FavBar =
	{
		Click: function (i, bNew)
		{
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var item = items[i];
				if (item) {
					var type = item.getAttribute("Type");
					Exec(te, item.text, ((bNew && api.PathMatchSpec(s, "Open;Open in background")) || (type == "Open" && GetAddonOption("favbar", "NewTab"))) ? "Open in new tab" : type, te.hwnd, null);
				}
				return false;
			}
		},

		Down: function (i)
		{
			if (api.GetKeyState(VK_MBUTTON) < 0) {
				return this.Click(i, true);
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
					pt.y += o.offsetHeight;
					MakeMenus(hMenu, null, arMenu, items, te, pt);
					AdjustMenuBreak(hMenu);
					AddEvent("ExitMenuLoop", function () {
						Addons.FavBar.bClose = true;
						setTimeout("Addons.FavBar.bClose = false;", 100);
					});
					window.g_menu_click = 2;
					var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
					api.DestroyMenu(hMenu);
					if (nVerb > 0) {
						item = items[nVerb - 1];
						var strType = item.getAttribute("Type");
						if (strType == "Open" && (window.g_menu_button == 3 || GetAddonOption("favbar", "NewTab"))) {
							strType = "Open in New Tab";
						}
						if (window.g_menu_button == 2 && api.PathMatchSpec(strType, "Open;Open in New Tab;Open in Background")) {
							PopupContextMenu(item.text);
							return S_OK;
						}
						Exec(te, item.text, strType, te.hwnd, null);
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
					var strType = item.getAttribute("Type").toLowerCase();
					var strFlag = strType == "menus" ? item.text.toLowerCase() : "";
					if (strFlag == "close" && menus) {
						menus--;
						continue;
					}
					var menus1 = menus;
					if (strFlag == "open") {
						if (menus++) {
							continue;
						}
					} else if (menus) {
						continue;
					}
					var img = '';
					var icon = item.getAttribute("Icon");
					if (icon != "-") {
						var h = GetIconSize(item.getAttribute("Height") || GetAddonOption("favbar", "Size"), 16);
						if (icon) {
							img = GetImgTag({ src: ExtractMacro(te, icon) }, h);
						} else if (api.PathMatchSpec(strType, "Open;Open in New Tab;Open in Background;Exec")) {
							var path = Addons.FavBar.GetPath(items, i);
							var pidl = api.ILCreateFromPath(path);
							if (api.ILIsEmpty(pidl) || pidl.Unavailable) {
								var res = /"([^"]*)"/.exec(path) || /([^\s]*)/.exec(path);
								if (res) {
									pidl = api.ILCreateFromPath(res[1]);
								}
							}
							img = GetImgTag({ src: GetIconImage(pidl, GetSysColor(COLOR_WINDOW)) }, h);
						} else if (strFlag == "open") {
							img = GetImgTag({ src: "folder:closed" }, h);
						}
					}
					s.push('<span id="_favbar', i, '" ', strType != "menus" || api.StrCmpI(item.text, "Open") ? 'onclick="Addons.FavBar.Click(' + i + ')" onmousedown="Addons.FavBar.Down(' : 'onmousedown="Addons.FavBar.Open(');
					s.push(i, ')" oncontextmenu="return Addons.FavBar.Popup(', i, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="', EncodeSC(item.text), '">', img, EncodeSC(ExtractMacro(te, item.getAttribute("Name").replace(/\\t.*$/g, "").replace(/&(.)/g, "$1"))), '</span> ');
				}
				s.push('&nbsp;</label>');

				var o = document.getElementById('_favbar');
				o.innerHTML = s.join("");
				ApplyLang(o);
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
	Addons.FavBar.Parent = document.getElementById(SetAddon(Addon_Id, Default, '<span id="_favbar"></span>'));
	AddEvent("FavoriteChanged", Addons.FavBar.Arrange);
	AddEvent("Load", Addons.FavBar.Arrange);

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
				var i = Addons.FavBar.FromPt(items.length, pt);
				if (i >= 0) {
					hr = Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect);
					return S_OK;
				}
			}
			if (HitTest(Addons.FavBar.Parent, pt) && dataObj.Count) {
				pdwEffect[0] = DROPEFFECT_LINK;
				return S_OK;
			}
		}
		MouseOut("_favbar");
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		MouseOut();
		if (Ctrl.Type == CTRL_WB) {
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var i = Addons.FavBar.FromPt(items.length + 1, pt);
				if (i >= 0) {
					return Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect, true);
				}
			}
			if (HitTest(Addons.FavBar.Parent, pt) && dataObj.Count) {
				setTimeout(function ()
				{
					AddFavorite(dataObj.Item(0));
				}, 99);
				return S_OK;
			}
		}
	});

	AddEvent("DragLeave", MouseOut);
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="NewTab" value="2">Open in New Tab</label><br><label>Icon</label></label><br><input type="text" name="Size" size="4">');
}
