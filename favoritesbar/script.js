const Addon_Id = "favoritesbar";

if (window.Addon == 1) {
	if (!ui_.MenuFavorites) {
		const menus = await te.Data.xmlMenus.getElementsByTagName('Favorites');
		if (menus && await GetLength(menus)) {
			ui_.MenuFavorites = await GetXmlItems(await menus[0].getElementsByTagName("Item"));
		}
	}
	let item = await GetAddonElement(Addon_Id);
	Addons.FavoritesBar = {
		Align: SameText(item.getAttribute("Align"), "Right") ? "Right" : "Left",
		arExpand: GetNum(item.getAttribute("Expanded")) ? [BUTTONS.opened, ''] : [BUTTONS.closed, ' style="display: none"'],
		Height: item.getAttribute("Height") || '100%',
		NewTab: item.getAttribute("NewTab"),

		Open: function (ev, i, bNew) {
			const items = ui_.MenuFavorites;
			const item = items[i];
			let type = item.Type;
			if (/^Open$/i.test(type)) {
				if (bNew || ev.ctrlKey || Addons.FavoritesBar.NewTab) {
					type = "Open in new tab";
				}
			}
			if (/^Menus$/i.test(type)) {
				let o = document.getElementById("fav" + i + "_button");
				let oChild = document.getElementById("fav" + i + "_");
				if (oChild.style.display == "none") {
					o.innerHTML = BUTTONS.opened;
					oChild.style.display = "block";
				} else {
					o.innerHTML = BUTTONS.closed;
					oChild.style.display = "none";
				}
				return;
			}
			Exec(te, item.text, type, ui_.hwnd);
		},

		Down: function (ev, i) {
			if ((ev.buttons != null ? ev.buttons : ev.button) == 4) {
				this.Open(ev, i, true);
			}
		},

		Popup: async function (ev, i) {
			const items = ui_.MenuFavorites;
			if (i >= 0) {
				const hMenu = await api.CreatePopupMenu();
				const path = await this.GetPath(items, i);
				const ContextMenu = await api.ContextMenu(path);
				if (ContextMenu) {
					await ContextMenu.QueryContextMenu(hMenu, 0, 0x1001, 0x7FFF, CMF_DEFAULTONLY);
					await RemoveCommand(hMenu, ContextMenu, "delete;rename");
					await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
					await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 3, await api.LoadString(hShell32, 31368));
				}
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, await GetText("&Edit"));
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, await GetText("Add"));
				const x = ev.screenX * ui_.Zoom;
				const y = ev.screenY * ui_.Zoom;
				const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, x, y, ui_.hwnd, null, ContextMenu);
				if (nVerb >= 0x1001) {
					const s = await ContextMenu.GetCommandString(nVerb - 0x1001, GCS_VERB);
					if (SameText(s, "delete")) {
						this.ShowOptions();
					} else {
						ContextMenu.InvokeCommand(0, ui_.hwnd, nVerb - 0x1001, null, null, SW_SHOWNORMAL, 0, 0);
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
		},

		Arrange: async function () {
			const s = [];
			let nLevel = 0;
			const items = await Addons.FavoritesBar.GetFovorites();
			for (let i = 0; i < items.length; ++i) {
				let strName = items[i].Name;
				if (!items[i].Org) {
					strName = await GetText(strName);
				}
				const strType = items[i].Type;
				let img = PathUnquoteSpaces(items[i].Icon);
				let path = items[i].text;
				let nOpen = 0;
				if (SameText(strType, "Menus")) {
					if (SameText(path, "Open")) {
						nOpen = 1;
					} else if (SameText(path, "Close")) {
						s.push('</div>');
						nLevel && --nLevel;
						continue;
					} else {
						strName = "-";
					}
				}
				if (strName == "-") {
					s.splice(s.length, 0, '<div style="width: 90%; width: calc(100% - 8px); height: 3px; background-color: ' + await GetWebColor(await GetSysColor(COLOR_ACTIVEBORDER)) + '; border: 1px solid ' + await GetWebColor(await GetSysColor(COLOR_WINDOW)) + '; font-size: 1px"></div>');
					continue;
				}
				path = await Addons.FavoritesBar.GetPath(items, i);
				if (nOpen) {
					img = '<a id="fav' + i + '_button" class="treebutton">' + Addons.FavoritesBar.arExpand[0] + '</a>' + await GetImgTag({ src: img || "folder:closed", "class": "favicon" });
				} else if (img) {
					img = await GetImgTag({ src: img, "class": "favicon" });
				} else if (await api.PathMatchSpec(strType, "Open;Open in New Tab;Open in Background;Exec")) {
					let pidl = await api.ILCreateFromPath(path);
					if (await api.ILIsEmpty(pidl) || await pidl.Unavailable) {
						let res = /"([^"]*)"/.exec(path) || /([^ ]*)/.exec(path);
						if (res) {
							pidl = await api.ILCreateFromPath(res[1]);
						}
					}
					img = await GetImgTag({ src: await GetIconImage(pidl, CLR_DEFAULT | COLOR_WINDOW), "class": "favicon" });
				} else {
					img = await GetImgTag({ src: "icon:shell32.dll,0", "class": "favicon" });
				}
				s.splice(s.length, 0, '<div id="fav', i, '" onclick="Addons.FavoritesBar.Open(event,', i, ')" oncontextmenu="Addons.FavoritesBar.Popup(event,' + i + '); return false" onmousedown="return Addons.FavoritesBar.Down(event,', i, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="', EncodeSC(items[i].text), '" draggable="true" ondragstart="Addons.FavoritesBar.Start5(event,this)" ondragend="Addons.FavoritesBar.End5(this)" style="width: 100%">', new Array(nLevel + (nOpen ? 1 : 2)).join('<span class="treespace">' + BUTTONS.opened + '</span>'), img, " ", EncodeSC(strName.replace(/\\t.*$/g, "").replace(/&(.)/g, "$1")), '</div> ');
				if (nOpen) {
					s.push('<div id="fav', i, '_"', Addons.FavoritesBar.arExpand[1], '>');
					++nLevel;
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
			Navigate(GetParentFolderName(path), SBSP_NEWBROWSER);
			setTimeout(async function () {
				FV = await te.Ctrl(CTRL_FV);
				FV.SelectItem(path, SVSI_SELECT | SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_NOTAKEFOCUS);
			}, 99);
		},

		GetPath: async function (items, i) {
			const line = items[i].text.split("\n");
			return await ExtractPath(te, line[0]);
		},

		FromPt: async function (pt) {
			const ptc = await pt.Clone();
			await api.ScreenToClient(await WebBrowser.hwnd, ptc);
			for (let el = document.elementFromPoint(await ptc.x, await ptc.y); el; el = el.parentElement) {
				const res = /^fav(\d+)$/.exec(el.id);
				if (res) {
					return res[1];
				}
			}
			return -1;
		},

		GetFovorites: async function () {
			if (!ui_.MenuFavorites) {
				const menus = await te.Data.xmlMenus.getElementsByTagName('Favorites');
				if (menus && await GetLength(menus)) {
					ui_.MenuFavorites = await GetXmlItems(await menus[0].getElementsByTagName("Item"));
				}
			}
			return ui_.MenuFavorites;
		},

		SetRects: async function () {
			Common.FavoritesBar.rc = await GetRect(document.getElementById('favoritesbar'));
			Common.FavoritesBar.rcItem = await api.CreateObject("Array");
			for (let i = ui_.MenuFavorites.length; i-- > 0;) {
				Common.FavoritesBar.rcItem[i] = await GetRect(document.getElementById("fav" + i));
			}
		},

		Start5: function (ev, o) {
			ev.dataTransfer.effectAllowed = 'move';
			Common.FavoritesBar.drag5 = o.id;
			let nCount = 0, nLevel = 0;
			const items = ui_.MenuFavorites;
			const src = o.id.replace(/\D/g, "");
			for (let i = src; i < items.length; ++i) {
				let strType = items[i].Type;
				let path = items[i].text;
				if (nLevel || i == src) {
					if (SameText(strType, "Menus")) {
						if (SameText(path, "Open")) {
							++nLevel;
						} else if (SameText(path, "Close") && nLevel) {
							--nLevel;
						}
					}
					++nCount;
					continue;
				}
				break;
			}
			Common.FavoritesBar.count5 = nCount;
			return true;
		},

		End5: function () {
			Common.FavoritesBar.drag5 = false;
		}
	};

	AddEvent("Layout", async function () {
		if (!await te.Data["Conf_" + Addons.FavoritesBar.Align + "BarWidth"]) {
			te.Data["Conf_" + Addons.FavoritesBar.Align + "BarWidth"] = 178;
		}
		Addons.FavoritesBar.Width = await te.Data["Conf_" + Addons.FavoritesBar.Align + "BarWidth"];
		let h = Addons.FavoritesBar.Height;
		if (isFinite(h)) {
			h += "px";
		}
		SetAddon(Addon_Id, Addons.FavoritesBar.Align + "Bar2", ['<div id="favoritesbar" class="pane" style="width: 100%; height:', EncodeSC(h), '; overflow: auto;">']);
	});

	AddEvent("Resize", async function () {
		const w = await te.Data["Conf_" + Addons.FavoritesBar.Align + "BarWidth"];
		Addons.FavoritesBar.Width = w;
		const el = document.getElementById('favoritesbar');
		el.style.width = w + "px";
		Common.FavoritesBar.rc = await GetRect(el);
	});

	AddEvent("FavoriteChanged", Addons.FavoritesBar.Changed);

	AddEvent("Load", Addons.FavoritesBar.Arrange);

	Common.FavoritesBar = await api.CreateObject("Object");

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
