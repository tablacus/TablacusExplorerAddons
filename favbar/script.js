const Addon_Id = "favbar";
const Default = "ToolBar4Center";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.FavBar = {
		DD: !item.getAttribute("NoDD"),
		NewTab: item.getAttribute("NewTab"),
		Size: item.getAttribute("Size"),

		Click: function (i, bNew) {
			const items = ui_.MenuFavorites;
			const item = items[i];
			if (item) {
				Exec(te, item.text, ((bNew && /^Open$|^Open in background$/i.test(item.Type)) || (SameText(item.Type, "Open") && Addons.FavBar.NewTab)) ? "Open in new tab" : item.Type, ui_.hwnd, null);
			}
		},

		Down: function (ev, i) {
			if ((ev.buttons != null ? ev.buttons : ev.button) == 4) {
				this.Click(i, true);
			}
		},

		Open: async function (ev, i) {
			if (Addons.FavBar.bClose) {
				return S_OK;
			}
			if ((ev.buttons != null ? ev.buttons : ev.button) == 1) {
				const menus = await te.Data.xmlMenus.getElementsByTagName('Favorites');
				if (menus && await GetLength(menus)) {
					const items = await menus[0].getElementsByTagName("Item");
					let item = items[i];
					const hMenu = await api.CreatePopupMenu();
					const arMenu = await api.CreateObject("Array");
					for (let j = await GetLength(items); --j > i;) {
						await arMenu.unshift(j);
					}
					const o = document.getElementById("_favbar" + i);
					const pt = await GetPosEx(o, 9);
					await MakeMenus(hMenu, null, arMenu, items, te, pt);
					await AdjustMenuBreak(hMenu);
					AddEvent("ExitMenuLoop", function () {
						Addons.FavBar.bClose = true;
						setTimeout(function () {
							Addons.FavBar.bClose = false;
						}, 99);
					});
					window.g_menu_click = 2;
					const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y, ui_.hwnd, null);
					api.DestroyMenu(hMenu);
					if (nVerb > 0) {
						item = await items[nVerb - 1];
						let strType = await item.getAttribute("Type");
						if (SameText(strType, "Open") && (window.g_menu_button == 3 || Addons.FavBar.NewTab)) {
							strType = "Open in new tab";
						}
						if (window.g_menu_button == 2 && /^Open$|^Open in new tab$|^Open in background$/i.test(strType)) {
							PopupContextMenu(await item.text);
							return S_OK;
						}
						Exec(te, await item.text, strType, ui_.hwnd, null);
					}
					return S_OK;
				}
			}
		},

		Popup: async function (ev, i) {
			const items = ui_.MenuFavorites;
			if (i >= 0) {
				const hMenu = await api.CreatePopupMenu();
				let ContextMenu = null;
				if (i < items.length) {
					const path = this.GetPath(items, i);
					if (path != "") {
						ContextMenu = await api.ContextMenu(path);
					}
				}
				if (ContextMenu) {
					await ContextMenu.QueryContextMenu(hMenu, 0, 0x1001, 0x7FFF, CMF_DEFAULTONLY);
					await RemoveCommand(hMenu, ContextMenu, "delete;rename");
					await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				}
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, await GetText("&Edit"));
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, await GetText("Add"));
				const x = ev.screenX * ui_.Zoom, y = ev.screenY * ui_.Zoom;
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
				api.DestroyMenu(hMenu);
			}
		},

		DropDown: async function (i) {
			const o = document.getElementById("_favbar" + i);
			MouseOver(o);
			const pt = GetPos(o, 9);
			const items = ui_.MenuFavorites;
			const strType = items[i].Type;
			let wFlags = SBSP_SAMEBROWSER;
			if (SameText(strType, "Open in new tab")) {
				wFlags = SBSP_NEWBROWSER;
			} else if (SameText(strType, "Open in background")) {
				wFlags = SBSP_NEWBROWSER | SBSP_ACTIVATE_NOFOCUS;
			}
			FolderMenu.Invoke(await FolderMenu.Open(items[i].text.split("\n")[0], pt.x, pt.y, "*", 1), wFlags);
		},

		Arrange: async function () {
			const s = [];
			const items = await Addons.FavBar.GetFovorites();
			let menus = 0;
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				const strFlag = SameText(item.Type, "menus") ? item.text.toLowerCase() : "";
				const strName = EncodeSC(await ExtractMacro(te, item.Name.replace(/\\t.*$/g, "").replace(/&(.)/g, "$1")));
				if (strFlag == "close" && menus) {
					menus--;
					continue;
				}
				if (strFlag == "open") {
					if (menus++) {
						continue;
					}
				} else if (menus) {
					continue;
				} else if (strName == "/" || strFlag == "break") {
					s.push('<br class="break">');
					continue;
				} else if (strName == "//" || strFlag == "barbreak") {
					s.push('<hr class="barbreak">');
					continue;
				} else if (strName == "-" || strFlag == "separator") {
					s.push('<span class="separator">|</span>');
					continue;
				}
				let img = '';
				const icon = item.Icon;
				if (icon != "-") {
					const h = GetIconSize(item.Height || Addons.FavBar.Size, 16);
					if (icon) {
						img = await GetImgTag({ src: await ExtractMacro(te, icon) }, h);
					} else if (/^Open$|^Open in new tab$|^Open in background$|^Exec$/i.test(item.Type)) {
						const path = await Addons.FavBar.GetPath(items, i);
						let pidl = await api.ILCreateFromPath(path);
						if (await api.ILIsEmpty(pidl) || await pidl.Unavailable) {
							const res = /"([^"]*)"/.exec(path) || /([^\s]*)/.exec(path);
							if (res) {
								pidl = await api.ILCreateFromPath(res[1]);
							}
						}
						img = await GetImgTag({ src: await GetIconImage(pidl, await GetSysColor(COLOR_WINDOW)) }, h);
					} else if (strFlag == "open") {
						img = await GetImgTag({ src: "folder:closed" }, h);
					}
				}
				s.push('<span id="_favbar', i, '" ', !SameText(item.Type, "menus") || !SameText(item.text, "Open") ? 'onclick="Addons.FavBar.Click(' + i + ')" onmousedown="Addons.FavBar.Down(event, ' : 'onmousedown="Addons.FavBar.Open(event, ');
				s.push(i, ')" oncontextmenu="return Addons.FavBar.Popup(event, ', i, '); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="', EncodeSC(item.text), '">', img, strName, '</span>');
				if (Addons.FavBar.DD && /^Open$|^Open in new tab$|^Open in background$/i.test(item.Type)) {
					s.push('<div class="button" onmouseover="MouseOver(this);" onmouseout="MouseOut()" onclick="Addons.FavBar.DropDown(', i, ')">', BUTTONS.dropdown, '</div>');
				} else {
					s.push(" ");
				}
			}
			s.push('&nbsp;</label>');

			const o = document.getElementById('_favbar');
			o.innerHTML = s.join("");
			ApplyLang(o);
			Resize();
		},

		GetFovorites: async function () {
			if(!ui_.MenuFavorites) {
				const menus = await te.Data.xmlMenus.getElementsByTagName('Favorites');
				if (menus && await GetLength(menus)) {
					ui_.MenuFavorites = await GetXmlItems(await menus[0].getElementsByTagName("Item"));
				}
			}
			return ui_.MenuFavorites;
		},

		ShowOptions: function (i) {
			ShowOptions("Tab=Menus&Menus=Favorites" + (isFinite(i) ? "," + i : ""));
		},

		GetPath: async function (items, i) {
			const line = items[i].text.split("\n");
			return await api.PathUnquoteSpaces(await ExtractMacro(null, line[0]));
		},

		SetRects: async function () {
			const items = await Addons.FavBar.GetFovorites();
			for (let i = 0; i < items.length; ++i) {
				const el = document.getElementById("_favbar" + i);
				if (el) {
					Common.FavBar.Items[i] = await GetRect(el);
				}
			}
			Common.FavBar.Append = await GetRect(Addons.FavBar.Parent);
		}
	};
	Addons.FavBar.Parent = document.getElementById(SetAddon(Addon_Id, Default, '<span id="_favbar"></span>'));
	AddEvent("FavoriteChanged", Addons.FavBar.Arrange);
	AddEvent("Load", Addons.FavBar.Arrange);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
