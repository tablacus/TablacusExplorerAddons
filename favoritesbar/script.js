var Addon_Id = "favoritesbar";

if (window.Addon == 1) {
	Addons.FavoritesBar =
	{
		Align: api.StrCmpI(GetAddonOption(Addon_Id, "Align"), "Right") ? "Left" : "Right",
		arExpand: GetAddonOptionEx("favoritesbar", "Expanded") ? [BUTTONS.opened, ''] : [BUTTONS.closed, ' style="display: none"'],
		Height: GetAddonOption(Addon_Id, "Height") || '100%',

		Init: function () {
			if (!te.Data["Conf_" + Addons.FavoritesBar.Align + "BarWidth"]) {
				te.Data["Conf_" + Addons.FavoritesBar.Align + "BarWidth"] = 178;
			}
			Addons.FavoritesBar.Width = te.Data["Conf_" + Addons.FavoritesBar.Align + "BarWidth"];
			var h = Addons.FavoritesBar.Height;
			if (isFinite(h)) {
				h += "px";
			}
			SetAddon(Addon_Id, Addons.FavoritesBar.Align + "Bar2", ['<div id="favoritesbar" class="pane" style="width: 100%; height:', EncodeSC(h), '; overflow: auto;">']);
		},

		Open: function (i, bNew) {
			var menus = te.Data.xmlMenus.getElementsByTagName("Favorites");
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var item = items[i];
				var type = item.getAttribute("Type");
				if (/^Open$/i.test(type)) {
					if (bNew || api.GetKeyState(VK_CONTROL) < 0 || GetAddonOption("favoritesbar", "NewTab")) {
						type = "Open in new tab";
					}
				}
				if (/^Menus$/i.test(type)) {
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

		Down: function (i) {
			if (api.GetKeyState(VK_MBUTTON) < 0) {
				this.Open(i, true);
				return false;
			}
		},

		Popup: function (i) {
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

		Arrange: function () {
			var s = [];
			var nLevel = 0;
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				for (var i = 0; i < items.length; ++i) {
					var strName = items[i].getAttribute("Name");
					if (!items[i].getAttribute("Org")) {
						strName = GetText(strName);
					}
					var strType = items[i].getAttribute("Type");
					var img = api.PathUnquoteSpaces(items[i].getAttribute("Icon"));
					var path = items[i].text;
					var nOpen = 0;
					if (api.StrCmpI(strType, "Menus") == 0) {
						if (api.StrCmpI(path, "Open") == 0) {
							nOpen = 1;
						} else if (api.StrCmpI(path, "Close") == 0) {
							s.push('</div>');
							nLevel && --nLevel;
							continue;
						} else {
							strName = "-";
						}
					}
					if (strName == "-") {
						s.splice(s.length, 0, '<div style="width: 90%; width: calc(100% - 8px); height: 3px; background-color: ' + GetWebColor(GetSysColor(COLOR_ACTIVEBORDER)) + '; border: 1px solid ' + GetWebColor(GetSysColor(COLOR_WINDOW)) + '; font-size: 1px"></div>');
						continue;
					}
					path = Addons.FavoritesBar.GetPath(items, i);
					if (nOpen) {
						img = '<a id="fav' + i + '_button" class="treebutton">' + Addons.FavoritesBar.arExpand[0] + '</a>' + GetImgTag({ src: img || "folder:closed", class: "favicon" });
					} else if (img) {
						img = GetImgTag({ src: img, class: "favicon" });
					} else if (api.PathMatchSpec(strType, "Open;Open in New Tab;Open in Background;Exec")) {
						var pidl = api.ILCreateFromPath(path);
						if (api.ILIsEmpty(pidl) || pidl.Unavailable) {
							var res = /"([^"]*)"/.exec(path) || /([^ ]*)/.exec(path);
							if (res) {
								pidl = api.ILCreateFromPath(res[1]);
							}
						}
						img = GetImgTag({ src: GetIconImage(pidl, GetSysColor(COLOR_WINDOW)), class: "favicon" });
					} else {
						img = GetImgTag({ src: "icon:shell32.dll,0", class: "favicon" });
					}
					s.splice(s.length, 0, '<div id="fav', i, '" onclick="Addons.FavoritesBar.Open(', i, ')" oncontextmenu="Addons.FavoritesBar.Popup(' + i + '); return false" onmousedown="return Addons.FavoritesBar.Down(', i, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="', EncodeSC(items[i].text), '" draggable="true" ondragstart="Addons.FavoritesBar.Start5(this)" ondragend="Addons.FavoritesBar.End5(this)" ondragover="Addons.FavoritesBar.Over5(this)" ondrop="Addons.FavoritesBar.Drop5(this)"  style="width: 100%">', new Array(nLevel + (nOpen ? 1 : 2)).join('<span class="treespace">' + BUTTONS.opened + '</span>'), img, " ", EncodeSC(strName.replace(/\\t.*$/g, "").replace(/&(.)/g, "$1")), '</div> ');
					if (nOpen) {
						s.push(api.sprintf(99, '<div id="fav%d_"%s>', i, Addons.FavoritesBar.arExpand[1]));
						++nLevel;
					}
				}
			}
			document.getElementById("favoritesbar").innerHTML = s.join("");
		},

		Changed: function () {
			Addons.FavoritesBar.Arrange();
			ApplyLang(document.getElementById("favoritesbar"));
		},

		ShowOptions: function (i) {
			ShowOptions("Tab=Menus&Menus=Favorites" + (isFinite(i) ? "," + i : ""));
		},

		OpenContains: function (path) {
			Navigate(fso.GetParentFolderName(path), SBSP_NEWBROWSER);
			setTimeout(function () {
				FV = te.Ctrl(CTRL_FV);
				FV.SelectItem(path, SVSI_SELECT | SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_NOTAKEFOCUS);
			}, 99);
		},

		GetPath: function (items, i) {
			var line = items[i].text.split("\n");
			return api.PathUnquoteSpaces(ExtractMacro(null, line[0]));
		},

		FromPt: function (pt) {
			var ptc = pt.Clone();
			api.ScreenToClient(api.GetWindow(document), ptc);
			for (var el = document.elementFromPoint(ptc.x, ptc.y); el; el = el.parentElement) {
				var res = /^fav(\d+)$/.exec(el.id);
				if (res) {
					return res[1];
				}
			}
			return -1;
		},

		Start5: function (o) {
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				event.dataTransfer.effectAllowed = 'move';
				Addons.FavoritesBar.drag5 = o.id;
				var xml = te.Data.xmlMenus;
				var menus = xml.getElementsByTagName("Favorites");
				var nCount = 0, nLevel = 0;
				if (menus && menus.length) {
					var items = menus[0].getElementsByTagName("Item");
					var src = o.id.replace(/\D/g, "");
					for (var i = src; i < items.length; ++i) {
						var strType = items[i].getAttribute("Type");
						var path = items[i].text;
						if (nLevel || i == src) {
							if (api.StrCmpI(strType, "Menus") == 0) {
								if (api.StrCmpI(path, "Open") == 0) {
									++nLevel;
								} else if (api.StrCmpI(path, "Close") == 0 && nLevel) {
									--nLevel;
								}
							}
							++nCount;
							continue;
						}
						break;
					}
				}
				Addons.FavoritesBar.count5 = nCount;
				return true;
			}
			return false;
		},

		End5: function () {
			Addons.FavoritesBar.drag5 = false;
		},

		Over5:function (o) {
			if (Addons.FavoritesBar.drag5) {
				var handle = event.preventDefault && true;
				var i = o.id.replace(/\D/g, "");
				var d = Addons.FavoritesBar.drag5.replace(/\D/g, "") - 0;
				if (i >= d && i < d + Addons.FavoritesBar.count5) {
					handle = false;
				}
				if (handle) {
					event.preventDefault();
				} else {
					event.returnValue = false;
				}
			}
		},

		Drop5: function (o) {
			var src = Addons.FavoritesBar.drag5;
			if (Addons.FavoritesBar.drag5) {
				src = src.replace(/\D/g, "") - 0;
				var dst = o.id.replace(/\D/g, "");
				var xml = te.Data.xmlMenus;
				var menus = xml.getElementsByTagName("Favorites");
				if (menus && menus.length) {
					var items = menus[0].getElementsByTagName("Item");
					var stack = [];
					var nCount = Addons.FavoritesBar.count5;
					for (var i = 0; i < items.length; ++i) {
						if (i >= src && i < src + nCount) {
							continue;
						}
						stack.push(items[i]);		
					}
					if (dst > src) {
						dst -= nCount - 1;
					}
					while (nCount-- > 0) {
						stack.splice(dst++, 0, items[src++]);
					}
					items.removeAll();
					while (stack.length) {
						menus[0].appendChild(stack.shift());
					}
					SaveXmlEx("menus.xml", xml);
					FavoriteChanged();
				}
				return true;
			}
			return false;
		},

	};

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
		if (Ctrl.Type == CTRL_WB) {
			return S_OK;
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
		if (Ctrl.Type == CTRL_WB) {
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var i = Addons.FavoritesBar.FromPt(pt);
				if (i >= 0) {
					hr = Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect);
					if (hr == S_OK && pdwEffect[0]) {
						MouseOver(document.getElementById("fav" + i));
					}
					return hr;
				}
			}
			if (HitTest(document.getElementById("favoritesbar"), pt) && dataObj.Count) {
				pdwEffect[0] = DROPEFFECT_LINK;
				MouseOut();
				return S_OK;
			}
		}
		MouseOut();
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
		MouseOut();
		if (Ctrl.Type == CTRL_WB) {
			var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var i = Addons.FavoritesBar.FromPt(pt);
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

	AddEvent("DragLeave", MouseOut);

	AddEvent("Resize", function () {
		var w = te.Data["Conf_" + Addons.FavoritesBar.Align + "BarWidth"];
		Addons.FavoritesBar.Width = w;
		document.getElementById('favoritesbar').style.width = w + "px";
	});

	AddEvent("FavoriteChanged", Addons.FavoritesBar.Changed);

	AddEvent("Load", Addons.FavoritesBar.Arrange);

	Addons.FavoritesBar.Init();
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}
