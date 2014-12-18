var Addon_Id = "toolbar";
var Default = "ToolBar2Left";
var AddonName = "ToolBar";

if (window.Addon == 1) {
	Addons.ToolBar =
	{
		Open: function (i)
		{
			if (Addons.ToolBar.bClose) {
				return S_OK;
			}
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				var items = te.Data.xmlToolBar.getElementsByTagName("Item");
				var item = items[i];
				if (api.PathMatchSpec(item.getAttribute("Type"), "Menus") && api.PathMatchSpec(item.text, "Open")) {
					var hMenu = api.CreatePopupMenu();
					var arMenu = [];
					for (var j = items.length; --j > i;) {
						arMenu.unshift(j);
					}
					var o = document.getElementById("_toolbar" + i);
					var pt = GetPos(o, true);
					pt.y += o.offsetHeight;
					MakeMenus(hMenu, null, arMenu, items, te, pt);
					AdjustMenuBreak(hMenu);
					AddEvent("ExitMenuLoop", function () {
						Addons.ToolBar.bClose = true;
						setTimeout("Addons.ToolBar.bClose = false;", 100);
					});
					var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
					api.DestroyMenu(hMenu);
					item = nVerb > 0 ? items[nVerb - 1] : null;
				}
				if (item) {
					Exec(te, item.text, item.getAttribute("Type"), te.hwnd, null);
				}
				return S_OK;
			}
		},

		Popup: function (i)
		{
			var items = te.Data.xmlToolBar.getElementsByTagName("Item");
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
					ContextMenu.QueryContextMenu(hMenu, 0, 0x1001, 0x7FFF, CMF_NORMAL);
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				}
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("&Edit"));
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, GetText("Add"));
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu);
				if (nVerb >= 0x1001) {
					var s = ContextMenu.GetCommandString(nVerb - 0x1001, GCS_VERB);
					if (api.strcmpi(s, "delete")) {
						ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 0x1001, null, null, SW_SHOWNORMAL, 0, 0);
					}
					else {
						this.ShowOptions();
					}
				}
				if (nVerb == 1) {
					this.ShowOptions(i + 1);
				}
				if (nVerb == 2) {
					this.ShowOptions();
				}
				api.DestroyMenu(hMenu);
			}
		},

		ShowOptions: function (nEdit)
		{
			AddonOptions("toolbar", function ()
			{
				Addons.ToolBar.Arrange();
				ApplyLang(document);
			}, {nEdit: nEdit});
		},

		FromPt: function (n, pt)
		{
			while (--n >= 0) {
				if (HitTest(document.getElementById("_toolbar" + n), pt)) {
					return n;
				}
			}
			return -1;
		},

		GetPath: function (items, i)
		{
			if (i < items.length) {
				var s = items[i].getAttribute("Type");
				if (s.match(/^Open$|^Open in New Tab$|Open in Background/i)) {
					var line = items[i].text.split("\n");
					return api.PathUnquoteSpaces(ExtractMacro(null, line[0]));
				}
			}
			return '';
		},

		Arrange: function ()
		{
			var s = [];
			var items = te.Data.xmlToolBar.getElementsByTagName("Item");
			var menus = 0;
			var image = te.GdiplusBitmap;
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var strFlag = api.strcmpi(item.getAttribute("Type"), "Menus") ? "" : item.text;
				if (api.PathMatchSpec(strFlag, "Close") && menus) {
					menus--;
					continue;
				}
				var menus1 = menus;
				if (api.PathMatchSpec(strFlag, "Open")) {
					if (menus++) {
						continue;
					}
				}
				else if (menus) {
					continue;
				}
				var img = item.getAttribute("Name");
				if (img == "/" || api.strcmpi(strFlag, "Break") == 0) {
					s.push("<br />");
				}
				else if (img == "//" || api.strcmpi(strFlag, "BarBreak") == 0) {
					s.push('<hr />');
				}
				else if (img == "-" || api.strcmpi(strFlag, "Separator") == 0) {
					s.push('<span style="color: gray">|</span>');
				}
				else {
					var icon = item.getAttribute("Icon");
					if (icon != "") {
						var h = item.getAttribute("Height").replace(/"/g, "");
						var sh = (h != "" ? ' style="height:' + h + 'px"' : '');
						h -= 0;
						img = '<img src="' + icon.replace(/"/g, "") + '"' + sh + '>';
					}
					s.push('<span id="_toolbar' + i + '" onmousedown="Addons.ToolBar.Open(' + i + ')" oncontextmenu="Addons.ToolBar.Popup(' + i + '); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="' + GetText(item.getAttribute("Name").replace(/"/g, "&quot;")) + '">' + img + '</span>');
				}
			}
			if (items.length == 0) {
				s.push('<label id="_toolbar' + items.length + '" title="Edit" onclick="Addons.ToolBar.ShowOptions()" oncontextmenu="Addons.ToolBar.ShowOptions(); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button">+</label>');
			}
			document.getElementById('_toolbar').innerHTML = s.join("");
			Resize();
		}

	}
	te.Data.xmlToolBar = OpenXml("toolbar.xml", false, true);
	SetAddon(Addon_Id, Default, '<span id="_' + Addon_Id + '"></span>');
	Addons.ToolBar.Arrange();

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_WB) {
			return S_OK;
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_WB) {
			var items = te.Data.xmlToolBar.getElementsByTagName("Item");
			var i = Addons.ToolBar.FromPt(items.length + 1, pt);
			if (i >= 0) {
				if (i == items.length) {
					pdwEffect.x = DROPEFFECT_LINK;
					MouseOver(document.getElementById("_toolbar" + i));
					return S_OK;
				}
				hr = Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect);
				if (hr == S_OK && pdwEffect.x) {
					MouseOver(document.getElementById("_toolbar" + i));
				}
				return S_OK;
			}
		}
		MouseOut("_toolbar");
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		MouseOut();
		if (Ctrl.Type == CTRL_WB) {
			var items = te.Data.xmlToolBar.getElementsByTagName("Item");
			var i = Addons.ToolBar.FromPt(items.length + 1, pt);
			if (i >= 0) {
				if (i == items.length) {
					var xml = te.Data.xmlToolBar;
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
							}
							else {
								item.setAttribute("Type", "Open");
							}
							root.appendChild(item);
						}
						SaveXmlEx("toolbar.xml", xml);
						ArrangeToolBar();
						ApplyLang(document);
					}
					return S_OK;
				}
				return Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect, true);
			}
		}
	});

	AddEvent("DragLeave", function (Ctrl)
	{
		MouseOut();
		return S_OK;
	});
}
