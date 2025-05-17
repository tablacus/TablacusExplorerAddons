const Addon_Id = "linkbar";
const Default = "ToolBar4Center";
if (window.Addon == 1) {
	let item = await GetAddonElement(Addon_Id);

	Addons.LinkBar = {
		DD: !item.getAttribute("NoDD"),
		Fill: item.getAttribute("Fill"),
		DropTo: !item.getAttribute("NoDropTo"),

		Click: async function (i, bNew) {
			const items = await GetXmlItems(await te.Data.xmlLinkBar.getElementsByTagName("Item"));
			const item = items[i];
			if (item) {
				Exec(te, item.text, (bNew && /^Open$|^Open in background$/i.test(item.type)) ? "Open in new tab" : item.Type, ui_.hwnd, null);
			}
			return false;
		},

		Down: function (ev, i) {
			if ((ev.buttons != null ? ev.buttons : ev.button) == 4) {
				return this.Click(i, true);
			}
		},

		Open: async function (ev, i) {
			if (Addons.LinkBar.bClose) {
				return S_OK;
			}
			if ((ev.buttons != null ? ev.buttons : ev.button) == 1) {
				const items = await te.Data.xmlLinkBar.getElementsByTagName("Item");
				let item = await items[i];
				const hMenu = await api.CreatePopupMenu();
				const arMenu = await api.CreateObject("Array");
				for (let j = await GetLength(items); --j > i;) {
					await arMenu.unshift(j);
				}
				const o = document.getElementById("_linkbar" + i);
				const pt = await GetPosEx(o, 9);
				await MakeMenus(hMenu, null, arMenu, items, te, pt);
				await AdjustMenuBreak(hMenu);
				AddEvent("ExitMenuLoop", function () {
					Addons.LinkBar.bClose = true;
					setTimeout(function () {
						Addons.LinkBar.bClose = false;
					}, 99);
				});
				const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y, ui_.hwnd, null);
				api.DestroyMenu(hMenu);
				if (nVerb > 0) {
					item = await items[nVerb - 1];
					Exec(te, await item.text, await item.getAttribute("Type"), ui_.hwnd, null);
				}
				return S_OK;
			}
		},

		Popup: async function (ev, i) {
			if (i >= 0) {
				const hMenu = await api.CreatePopupMenu();
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, await GetText("&Edit"));
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, await GetText("Add"));
				const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, ev.screenX * ui_.Zoom, ev.screenY * ui_.Zoom, ui_.hwnd, null, null);
				if (nVerb == 1) {
					this.ShowOptions(i + 1);
				}
				if (nVerb == 2) {
					this.ShowOptions();
				}
				api.DestroyMenu(hMenu);
			}
		},

		DropDown: async function (i) {
			const o = document.getElementById("_linkbar" + i);
			MouseOver(o);
			const pt = GetPos(o, 9);
			let items = await GetXmlItems(await te.Data.xmlLinkBar.getElementsByTagName("Item"));
			const strType = items[i].Type;
			let wFlags = SBSP_SAMEBROWSER;
			if (SameText(strType, "Open in new tab")) {
				wFlags = SBSP_NEWBROWSER;
			} else if (SameText(strType, "Open in background")) {
				wFlags = SBSP_NEWBROWSER | SBSP_ACTIVATE_NOFOCUS;
			}
			FolderMenu.Invoke(await FolderMenu.Open(items[i].text.split("\n")[0], pt.x, pt.y, "*", 1), wFlags);
			return false;
		},

		Arrange: async function () {
			const s = [];
			const items = await GetXmlItems(await te.Data.xmlLinkBar.getElementsByTagName("Item"));
			let menus = 0;
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				const strType = item.Type;
				const strFlag = SameText(strType, "Menus") ? item.text : "";
				if (SameText(strFlag, "close") && menus) {
					menus--;
					continue;
				}
				if (SameText(strFlag, "open")) {
					if (menus++) {
						continue;
					}
				} else if (menus) {
					continue;
				}
				if (SameText(strFlag, "break")) {
					s.push('<br class="break">');
				} else if (SameText(strFlag, "barbreak")) {
					s.push('<hr class="barbreak">');
				} else if (SameText(strFlag, "separator")) {
					s.push('<span class="separator">|</span>');
				} else {
					let img = '';
					const h = GetIconSize(item.Height, 16);
					const icon = item.Icon;
					if (icon) {
						img = await GetImgTag({ src: await ExtractMacro(te, icon) }, h);
					} else if (/^Open$|^Open in new tab$|^Open in background$|^Exec$/i.test(strType)) {
						const path = await Addons.LinkBar.GetPath(items, i);
						let pidl = await api.ILCreateFromPath(path);
						if (await api.ILIsEmpty(pidl) || await pidl.Unavailable) {
							const res = /"([^"]*)"/.exec(path) || /([^\s]*)/.exec(path);
							if (res) {
								pidl = await api.ILCreateFromPath(res[1]);
							}
						}
						if (pidl) {
							img = await GetImgTag({ src: await GetIconImage(pidl, CLR_DEFAULT | COLOR_WINDOW) }, h);
						}
					}
					s.push('<span id="_linkbar', i, '" ', !SameText(item.Type, "Menus") || !SameText(item.text, "Open") ? 'onclick="Addons.LinkBar.Click(' + i + ')" onmousedown="Addons.LinkBar.Down(event,' : 'onmousedown="Addons.LinkBar.Open(event,');
					s.push(i, ')" oncontextmenu="Addons.LinkBar.Popup(event,', i, '); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="', EncodeSC(await ExtractMacro(te, item.text)), '">', img, '<span class="linklabel"> ', EncodeSC(await ExtractMacro(te, item.Name)), '</span></span>');
					if (Addons.LinkBar.DD && /^Open$|^Open in new tab$|^Open in background$/.test(strType)) {
						s.push('<div class="button" onmouseover="MouseOver(this);" onmouseout="MouseOut()" onclick="Addons.LinkBar.DropDown(', i, ')">', BUTTONS.dropdown, '</div>');
					} else {
						s.push(" ");
					}
				}
			}
			s.push('<label id="_linkbar+" title="', await GetText("Add"), '" onclick="Addons.LinkBar.ShowOptions()"  onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button"');
			if (Addons.LinkBar.Fill) {
				s.push(' style="flex: 1"');
			}
			s.push('>&nbsp;</label>');

			document.getElementById('_linkbar').innerHTML = s.join("");
			Resize();
		},

		GetPath: async function (items, i) {
			const line = items[i].text.split("\n");
			return await ExtractPath(te, line[0]);
		},

		ShowOptions: async function (nEdit) {
			const opt = await api.CreateObject("Object");
			opt.nEdit = nEdit;
			AddonOptions("linkbar", "Addons.LinkBar.Changed", opt);
		},

		Changed: function () {
			Addons.LinkBar.Arrange();
			ApplyLang(document.getElementById("_linkbar"));
		},

		SetRects: async function () {
			const items = await GetXmlItems(await te.Data.xmlLinkBar.getElementsByTagName("Item"));
			if (Addons.LinkBar.DropTo) {
				Common.LinkBar.Count = items.length;
				for (let i = 0; i < items.length; ++i) {
					const el = document.getElementById("_linkbar" + i);
					if (el) {
						Common.LinkBar.Items[i] = await GetRect(el);
					}
				}
			}
			Common.LinkBar.Append = await GetRect(document.getElementById('_linkbar'));
		}

	};
	delete item;

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, Addons.LinkBar.Fill ? '<span id="_linkbar" style="display: flex"></span>' : '<span id="_linkbar"></span>');
	});

	AddEvent("Load", Addons.LinkBar.Arrange);

	te.Data.xmlLinkBar = await OpenXml("linkbar.xml", false, true);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	AddonName = "LinkBar";
	importScript("addons\\" + Addon_Id + "\\options.js");
}
