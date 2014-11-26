var Addon_Id = "linkbar";
var Default = "ToolBar4Center";

if (window.Addon == 1) {
	Addons.LinkBar =
	{
		Open: function (i)
		{
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
			Exec(external, items[i].text, items[i].getAttribute("Type"), te.hwnd, null);
		},

		Popup: function (i)
		{
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
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
			return false;
		},

		Arrange: function ()
		{
			var s = [];
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
			var image = te.GdiplusBitmap;
			for (var i = 0; i < items.length; i++) {
				var img = '';
				var icon = items[i].getAttribute("Icon");
				if (icon != "") {
					var h = items[i].getAttribute("Height").replace(/"/g, "");
					var sh = (h != "" ? ' style="height:' + h + 'px"' : '');
					h -= 0;
					img = '<img src="' + icon.replace(/"/g, "") + '"' + sh + '>';
				}
				else if (document.documentMode) { //IE8-
					var info = api.Memory("SHFILEINFO");
					var path = this.GetPath(items, i);
					var pidl = api.ILCreateFromPath(path);
					if (!pidl) {
						if (path.match(/"([^"]*)"/)) {
							pidl = api.ILCreateFromPath(RegExp.$1);
						}
						else if (path.match(/([^ ]*)/)) {
							pidl = api.ILCreateFromPath(RegExp.$1);
						}
					}
					if (pidl) {
						api.ShGetFileInfo(pidl, 0, info, info.Size, SHGFI_PIDL | SHGFI_ICON | SHGFI_SMALLICON);
						image.FromHICON(info.hIcon, api.GetSysColor(COLOR_BTNFACE));
						img = '<img src="data:image/png;base64,' + image.Base64("image/png" , info.hIcon) + '" /> ';
						api.DestroyIcon(info.hIcon);
					}
				}
				else if (/Open/i.test(items[i].getAttribute("Type"))) {
					img = '<img src="icon:shell32.dll,3,16" /> ';
				}
				s.push('<span id="Link', i, '" onclick="Addons.LinkBar.Open(', i, ')" oncontextmenu="return Addons.LinkBar.Popup(', i, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="', items[i].text.replace(/"/g, "&quot;"), '">', img, ' ', items[i].getAttribute("Name"), '</span> ');
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
				if (HitTest(document.getElementById("Link" + n), pt)) {
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
			hr = S_OK;
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_WB) {
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
			var i = Addons.LinkBar.FromPt(items.length + 1, pt);
			if (i >= 0) {
				if (i == items.length) {
					pdwEffect.x = DROPEFFECT_LINK;
					MouseOver(document.getElementById("Link" + i));
					return S_OK;
				}
				var hr = Exec(external, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect);
				if (hr == S_OK && pdwEffect.x) {
					MouseOver(document.getElementById("Link" + i));
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
							}
							else {
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

	AddEvent("Dragleave", function (Ctrl)
	{
		MouseOut();
	});
}
