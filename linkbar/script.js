var Addon_Id = "linkbar";
var Default = "ToolBar4Center";

if (window.Addon == 1) {
	g_linkbar =
	{
		DragEnter: te.OnDragEnter,
		DragOver: te.OnDragOver,
		Drop: te.OnDrop,
		DragLeave: te.OnDragleave,

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
				var ContextMenu = api.ContextMenu(this.GetPath(items, i));
				if (ContextMenu) {
					ContextMenu.QueryContextMenu(hMenu, 0, 0x1001, 0x7FFF, CMF_NORMAL);
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				}
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("&Edit"));
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu);
				if (nVerb >= 0x1001) {
					ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 0x1001, null, null, SW_SHOWNORMAL, 0, 0);
				}
				if (nVerb == 1) {
					this.ShowOptions();
				}
				api.DestroyMenu(hMenu);
			}
		},

		Arrange: function ()
		{
			var s = "";
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
			var image = te.GdiplusBitmap;
			for (var i = 0; i < items.length; i++) {
				var img = '';
				if (document.documentMode) { //IE8-
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
						img = '<img src="data:image/png;base64,' + image.Base64("image/png" , info.hIcon) + '"> ';
						api.DestroyIcon(info.hIcon);
					}
				}
				else {
					img = api.strcmpi(items[i].getAttribute("Type"), "Open") ? '<img src="../image/toolbar/s_3_2.png"> ' : '<img src="../image/toolbar/s_3_3.png"> ';
				}
				s += '<span id="Link' + i + '" onclick="g_linkbar.Open(' + i + ')" oncontextmenu="g_linkbar.Popup(' + i + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" title="' + items[i].text.replace(/"/g, "&quot;") + '">' + img + ' ' + items[i].getAttribute("Name") + '</span> ';
			}
			s += '<label id="Link' + items.length + '" title="Edit" onclick="g_linkbar.ShowOptions()"  onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button">';
		//	s += '<img src="../image/toolbar/s_2_22.png" bitmap="ieframe.dll,206,16,22"></label>';
			s += '&nbsp;</label>';

			document.getElementById('linkbar').innerHTML = s;
		},

		GetPath: function (items, i)
		{
			var line = items[i].text.split("\n");
			return api.PathUnquoteSpaces(ExtractMacro(null, line[0]));
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

		ShowOptions: function ()
		{
			AddonOptions("linkbar", function ()
			{
				g_linkbar.Arrange();
				ApplyLang(document);
			});
		}
	};
	te.Data.xmlLinkBar = OpenXml("linkbar.xml", false, true);
	SetAddon(Addon_Id, Default, '<span id="linkbar"></span>');
	g_linkbar.Arrange();

	te.OnDragEnter = function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		var hr = (g_linkbar.DragEnter) ? g_linkbar.DragEnter(Ctrl, dataObj, grfKeyState, pt, pdwEffect) : E_FAIL;
		if (Ctrl.Type == CTRL_WB) {
			hr = S_OK;
		}
		return hr;
	}

	te.OnDragOver = function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_WB) {
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
			var i = g_linkbar.FromPt(items.length + 1, pt);
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
		MouseOut("Link");
		return g_linkbar.DragOver ? g_linkbar.DragOver(Ctrl, dataObj, grfKeyState, pt, pdwEffect) : E_FAIL;
	}

	te.OnDrop = function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		MouseOut();
		if (Ctrl.Type == CTRL_WB) {
			var items = te.Data.xmlLinkBar.getElementsByTagName("Item");
			var i = g_linkbar.FromPt(items.length + 1, pt);
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
						g_linkbar.Arrange();
						ApplyLang(document);
					}
					return S_OK;
				}
				return Exec(external, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect, true);
			}
		}
		return g_linkbar.Drop ? g_linkbar.Drop(Ctrl, dataObj, grfKeyState, pt, pdwEffect) : E_FAIL;
	}

	te.OnDragleave = function (Ctrl)
	{
		MouseOut();
		return g_linkbar.DragLeave ? g_linkbar.DragLeave(Ctrl) : S_OK;
	}
}

