Addon_Id = "linkbar";
Default = "ToolBar4Center";
AddonName = "LinkBar";

if (window.Addon == 1) {
	Addons.LinkBar =
	{
		Click: function (i)
		{
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
			var item = items[i];
			if (item) {
				Exec(te, item.text, item.getAttribute("Type"), te.hwnd, null);
			}
			return S_OK;
		},

		Down: function (i)
		{
			if (api.GetKeyState(VK_MBUTTON) < 0) {
				var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
				var item = items[i];
				Exec(te, items[i].text, "Open in New Tab", te.hwnd);
				return false;
			}
		},

		Open: function (i)
		{
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
				pt.y += o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI;
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

		Popup: function (i)
		{
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

		Arrange: function ()
		{
			var s = [];
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
			var menus = 0;
			var image = te.GdiplusBitmap;
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var strFlag = api.StrCmpI(item.getAttribute("Type"), "Menus") ? "" : item.text;
				if (api.PathMatchSpec(strFlag, "Close") && menus) {
					menus--;
					continue;
				}
				var menus1 = menus;
				if (api.PathMatchSpec(strFlag, "Open")) {
					if (menus++) {
						continue;
					}
				} else if (menus) {
					continue;
				}
				var img = '';
				var icon = item.getAttribute("Icon");
				if (icon != "") {
					var h = (item.getAttribute("Height") || "").replace(/"/g, "");
					var sh = (h != "" ? ' style="height:' + h + 'px"' : '');
					h -= 0;
					img = '<img src="' + (icon || "").replace(/"/g, "") + '"' + sh + '>';
				} else if (/Open|Exec/i.test(item.getAttribute("Type"))) {
					var path = this.GetPath(items, i);
					var pidl = api.ILCreateFromPath(path);
					if (api.ILIsEmpty(pidl) || pidl.Unavailable) {
						var res = /"([^"]*)"/.exec(path) || /([^ ]*)/.exec(path);
						if (res) {
							pidl = api.ILCreateFromPath(res[1]);
						}
					}
					if (pidl) {
						img = '<img src="' + GetIconImage(pidl, GetSysColor(COLOR_WINDOW)) + '">';
					}
				}
				s.push('<span id="_linkbar', i, '" ', api.StrCmpI(item.getAttribute("Type"), "Menus") || api.StrCmpI(item.text, "Open") ? 'onclick="Addons.LinkBar.Click(' + i + ')" onmousedown="Addons.LinkBar.Down(' : 'onmousedown="Addons.LinkBar.Open(');
				s.push(i, ')" oncontextmenu="return Addons.LinkBar.Popup(', i, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="', item.text.replace(/"/g, "&quot;"), '">', img, ' ', items[i].getAttribute("Name"), '</span> ');
			}
			s.push('<label id="Link', items.length, '" title="Edit" onclick="Addons.LinkBar.ShowOptions()"  onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button">');
			s.push('&nbsp;</label>');

			document.getElementById('_linkbar').innerHTML = s.join("");
			Resize();
		},

		GetPath: function (items, i)
		{
			var line = items[i].text.split("\n");
			return api.PathUnquoteSpaces(ExtractMacro(null, line[0]));
		},

		ShowOptions: function (nEdit)
		{
			AddonOptions("linkbar", function ()
			{
				Addons.LinkBar.Arrange();
				ApplyLang(document);
			}, {nEdit: nEdit});
		},

		FromPt: function (n, pt)
		{
			while (--n >= 0) {
				if (HitTest(document.getElementById("_linkbar" + n), pt)) {
					return n;
				}
			}
			return -1;
		},

	};
	te.Data.xmlLinkBar = OpenXml("linkbar.xml", false, true);
	SetAddon(Addon_Id, Default, '<span id="_linkbar"></span>');
	Addons.LinkBar.Arrange();

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_WB) {
			return S_OK;
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
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
			}
		}
		MouseOut("_linkbar");
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		MouseOut();
		if (Ctrl.Type == CTRL_WB) {
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
			var i = Addons.LinkBar.FromPt(items.length + 1, pt);
			if (i >= 0) {
				if (i == items.length) {
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
					return S_OK;
				}
				return Exec(external, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect, true);
			}
		}
	});

	AddEvent("DragLeave", function (Ctrl)
	{
		MouseOut();
		return S_OK;
	});
}
