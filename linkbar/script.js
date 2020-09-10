var Addon_Id = "linkbar";
var Default = "ToolBar4Center";
var AddonName = "LinkBar";

if (window.Addon == 1) {
	Addons.LinkBar =
	{
		Click: function (i, bNew) {
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
			var item = items[i];
			if (item) {
				var type = item.getAttribute("Type");
				Exec(te, item.text, (bNew && api.PathMatchSpec(type, "Open;Open in background")) ? "Open in new tab" : item.getAttribute("Type"), te.hwnd, null);
			}
			return false;
		},

		Down: function (i) {
			if (api.GetKeyState(VK_MBUTTON) < 0) {
				return this.Click(i, true);
			}
		},

		Open: function (i) {
			if (Addons.LinkBar.bClose) {
				return S_OK;
			}
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
				var item = items[i];
				var hMenu = api.CreatePopupMenu();
				var arMenu = [];
				for (var j = items.length; --j > i;) {
					arMenu.unshift(j);
				}
				var o = document.getElementById("_linkbar" + i);
				var pt = GetPos(o, true);
				pt.y += o.offsetHeight;
				MakeMenus(hMenu, null, arMenu, items, te, pt);
				AdjustMenuBreak(hMenu);
				AddEvent("ExitMenuLoop", function () {
					Addons.LinkBar.bClose = true;
					setTimeout("Addons.LinkBar.bClose = false;", 100);
				});
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
				api.DestroyMenu(hMenu);
				if (nVerb > 0) {
					item = items[nVerb - 1];
					Exec(te, item.text, item.getAttribute("Type"), te.hwnd, null);
				}
				return S_OK;
			}
		},

		Popup: function (i) {
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
			if (i >= 0) {
				var hMenu = api.CreatePopupMenu();
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("&Edit"));
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, GetText("Add"));
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
				if (nVerb == 1) {
					this.ShowOptions(i + 1);
				}
				if (nVerb == 2) {
					this.ShowOptions();
				}
				api.DestroyMenu(hMenu);
			}
			return false;
		},

		DropDown: function (i) {
			var o = document.getElementById("_linkbar" + i);
			MouseOver(o);
			var pt = GetPos(o, true);
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
			var strType = items[i].getAttribute("Type");
			var wFlags = SBSP_SAMEBROWSER;
			if (api.StrCmpI(strType, "Open in new tab") == 0) {
				wFlags = SBSP_NEWBROWSER;
			} else if (api.StrCmpI(strType, "Open in background") == 0) {
				wFlags = SBSP_NEWBROWSER | SBSP_ACTIVATE_NOFOCUS;
			}
			FolderMenu.Invoke(FolderMenu.Open(items[i].text.split("\n")[0], pt.x, pt.y + o.offsetHeight, "*", 1), wFlags);
			return false;
		},

		Arrange: function () {
			var s = [];
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
			var menus = 0;
			var image = te.GdiplusBitmap;
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var strType = item.getAttribute("Type");
				var strFlag = (api.StrCmpI(strType, "Menus") ? "" : item.text).toLowerCase();
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
				if (strFlag == "break") {
					s.push('<br class="break" />');
				} else if (strFlag == "barbreak") {
					s.push('<hr class="barbreak" />');
				} else if (strFlag == "separator") {
					s.push('<span class="separator">|</span>');
				} else {
					var img = '';
					var h = GetIconSize(item.getAttribute("Height"), 16);
					var icon = item.getAttribute("Icon");
					if (icon) {
						img = GetImgTag({ src: ExtractMacro(te, icon) }, h);
					} else if (api.PathMatchSpec(strType, "Open;Open in new tab;Open in background;Exec")) {
						var path = Addons.LinkBar.GetPath(items, i);
						var pidl = api.ILCreateFromPath(path);
						if (api.ILIsEmpty(pidl) || pidl.Unavailable) {
							var res = /"([^"]*)"/.exec(path) || /([^\s]*)/.exec(path);
							if (res) {
								pidl = api.ILCreateFromPath(res[1]);
							}
						}
						if (pidl) {
							img = GetImgTag({ src: GetIconImage(pidl, GetSysColor(COLOR_WINDOW)) }, h);
						}
					}
					s.push('<span id="_linkbar', i, '" ', api.StrCmpI(item.getAttribute("Type"), "Menus") || api.StrCmpI(item.text, "Open") ? 'onclick="Addons.LinkBar.Click(' + i + ')" onmousedown="Addons.LinkBar.Down(' : 'onmousedown="Addons.LinkBar.Open(');
					s.push(i, ')" oncontextmenu="return Addons.LinkBar.Popup(', i, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="', EncodeSC(ExtractMacro(te, item.text)), '">', img, '<span class="linklabel"> ', EncodeSC(ExtractMacro(te, item.getAttribute("Name"))), '</span></span>');
					if (api.PathMatchSpec(strType, "Open;Open in new tab;Open in background")) {
						s.push('<div class="button" onmouseover="MouseOver(this);" onmouseout="MouseOut()" onclick="Addons.LinkBar.DropDown(', i, ')" style="vertical-align: top; opacity: 0.6">', "v", '</div>');
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

		GetPath: function (items, i) {
			var line = items[i].text.split("\n");
			return api.PathUnquoteSpaces(ExtractMacro(null, line[0]));
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
	te.Data.xmlLinkBar = OpenXml("linkbar.xml", false, true);
	Addons.LinkBar.Parent = document.getElementById(SetAddon(Addon_Id, Default, '<span id="_linkbar"></span>'));

	AddEvent("Load", Addons.LinkBar.Arrange);

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
				var hr = Exec(external, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect);
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
				return Exec(external, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect, true);
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
