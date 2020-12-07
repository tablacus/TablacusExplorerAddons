const Addon_Id = "linkbar";
const Default = "ToolBar4Center";

if (window.Addon == 1) {
	Addons.LinkBar = {
		DD: !await GetAddonOptionEx(Addon_Id, "NoDD"),
		clWindow: await GetSysColor(COLOR_WINDOW),

		Click: async function (i, bNew) {
			let items = await GetXmlItems(await te.Data.xmlLinkBar.getElementsByTagName("Item"));
			let item = items[i];
			if (item) {
				Exec(te, item.text, (bNew && /^Open$|^Open in background$/i.test(type)) ? "Open in new tab" : item.Type, ui_.hwnd, null);
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
				let items = await te.Data.xmlLinkBar.getElementsByTagName("Item");
				let item = await items[i];
				let hMenu = await api.CreatePopupMenu();
				let arMenu = await api.CreateObject("Array");
				for (let j = await GetLength(items); --j > i;) {
					await arMenu.unshift(j);
				}
				let o = document.getElementById("_linkbar" + i);
				let pt = await GetPosEx(o, 9);
				await MakeMenus(hMenu, null, arMenu, items, te, pt);
				await AdjustMenuBreak(hMenu);
				AddEvent("ExitMenuLoop", function () {
					Addons.LinkBar.bClose = true;
					setTimeout(function () {
						Addons.LinkBar.bClose = false;
					}, 99);
				});
				let nVerb = await api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y, ui_.hwnd, null);
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
				let hMenu = await api.CreatePopupMenu();
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, await GetText("&Edit"));
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, await GetText("Add"));
				let nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, ev.screenX * ui_.Zoom, ev.screenY * ui_.Zoom, ui_.hwnd, null, null);
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
			$.FolderMenu.Invoke(await $.FolderMenu.Open(items[i].text.split("\n")[0], pt.x, pt.y, "*", 1), wFlags);
			return false;
		},

		Arrange: async function () {
			let s = [];
			let items = await GetXmlItems(await te.Data.xmlLinkBar.getElementsByTagName("Item"));
			let menus = 0;
			for (let i = 0; i < items.length; i++) {
				let item = items[i];
				let strType = item.Type;
				let strFlag = (SameText(strType, "Menus") ? item.text : "").toLowerCase();
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
				}
				if (strFlag == "break") {
					s.push('<br class="break">');
				} else if (strFlag == "barbreak") {
					s.push('<hr class="barbreak">');
				} else if (strFlag == "separator") {
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
							img = await GetImgTag({ src: await GetIconImage(pidl, Addons.LinkBar.clWindow) }, h);
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
			s.push('<label id="Link', items.length, '" title="Edit" onclick="Addons.LinkBar.ShowOptions()"  onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button">');
			s.push('&nbsp;</label>');

			document.getElementById('_linkbar').innerHTML = s.join("");
			Resize();
		},

		GetPath: async function (items, i) {
			const line = items[i].text.split("\n");
			return await ExtractPath(te, line[0]);
		},

		ShowOptions: function (nEdit) {
			AddonOptions("linkbar", function () {
				Addons.LinkBar.Arrange();
				ApplyLang(document);
			}, { nEdit: nEdit });
		},

		FromPt: function (n, pt) {
			while (--n >= 0) {
				if (HitTest(document.getElementById("_linkbar" + n), pt)) {
					return n;
				}
			}
			return -1;
		},

		Append: function (dataObj) {
			var xml = te.Data.xmlLinkBar;
			var root = xml.documentElement;
			if (!root) {
				xml.appendChild(xml.createProcessingInstruction("xml", 'version="1.0" encoding="UTF-8"'));
				root = xml.createElement("TablacusExplorer");
				xml.appendChild(root);
			}
			if (root) {
				for (i = 0; i < dataObj.Count; i++) {
					var FolderItem = dataObj.Item(i);
					var item = xml.createElement("Item");
					item.setAttribute("Name", api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER));
					item.text = api.GetDisplayNameOf(FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);
					if (fso.FileExists(item.text)) {
						item.text = api.PathQuoteSpaces(item.text);
						item.setAttribute("Type", "Exec");
					} else {
						item.setAttribute("Type", "Open");
					}
					root.appendChild(item);
				}
				SaveXmlEx("linkbar.xml", xml);
				Addons.LinkBar.Arrange();
				ApplyLang(document);
			}
		}

	};
	te.Data.xmlLinkBar = await OpenXml("linkbar.xml", false, true);
	Addons.LinkBar.Parent = document.getElementById(SetAddon(Addon_Id, Default, '<span id="_linkbar"></span>'));

	AddEvent("Load", Addons.LinkBar.Arrange);

	if (!window.chrome) {
		AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
			if (Ctrl.Type == CTRL_WB) {
				return S_OK;
			}
		});

		AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
			if (Ctrl.Type == CTRL_WB) {
				var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
				var i = Addons.LinkBar.FromPt(items.length + 1, pt);
				if (i >= 0) {
					if (i == items.length) {
						pdwEffect[0] = DROPEFFECT_LINK;
						MouseOver(document.getElementById("_linkbar" + i));
						return S_OK;
					}
					var hr = Exec(external, items[i].text, items[i].getAttribute("Type"), ui_.hwnd, pt, dataObj, grfKeyState, pdwEffect);
					if (hr == S_OK && pdwEffect[0]) {
						MouseOver(document.getElementById("_linkbar" + i));
					}
					return S_OK;
				} else if (HitTest(Addons.LinkBar.Parent, pt) && dataObj.Count) {
					pdwEffect[0] = DROPEFFECT_LINK;
					return S_OK;
				}
			}
			MouseOut("_linkbar");
		});

		AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
			MouseOut();
			if (Ctrl.Type == CTRL_WB) {
				var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
				var i = Addons.LinkBar.FromPt(items.length + 1, pt);
				if (i >= 0) {
					if (i == items.length) {
						Addons.LinkBar.Append(dataObj);
						return S_OK;
					}
					return Exec(te, items[i].text, items[i].getAttribute("Type"), ui_.hwnd, pt, dataObj, grfKeyState, pdwEffect, true);
				} else if (HitTest(Addons.LinkBar.Parent, pt) && dataObj.Count) {
					Addons.LinkBar.Append(dataObj);
				}
			}
		});

		AddEvent("DragLeave", function (Ctrl) {
			MouseOut();
			return S_OK;
		});
	}
} else {
	AddonName = "LinkBar";
	importScript("addons\\" + Addon_Id + "\\options.js");
}
