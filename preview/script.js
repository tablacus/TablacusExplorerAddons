var Addon_Id = "preview";
var Default = "LeftBar3";

if (window.Addon == 1) {
	g_preview = 
	{	
		tid: null,

		Arrange: function (Item)
		{
			g_preview.Item = Item;
			var o = document.getElementById('PreviewBar');
			var s = [];
			if (Item) {
				var Folder = sha.NameSpace(Item.Parent);
				var info = [Folder.GetDetailsOf(Item, 0), "\n", Folder.GetDetailsOf(Item, 1)];
				if (Item.IsLink) {
					Item = api.ILCreateFromPath(Item.GetLink.Path);
				}
				var nWidth = 0, nHeight = 0;
				var s1 = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 13");
				if (s1) {
					info.push(' (' + s1 + ')');
					nWidth = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 3");
					nHeight = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 4");
				}
				var style;
				if (nWidth  > nHeight) {
					style = "width: " + te.offsetLeft + "px; height: " + (te.offsetLeft * nHeight / nWidth) + "px";
				} else {
					style = "width: " + (te.offsetLeft * nWidth / nHeight) + "px; height: " + te.offsetLeft + "px";
				}
				var info2 = [];
				for (var i = 2; i < 4; i++) {
					info2.push("\n" + Folder.GetDetailsOf(null, i) + ": " + Folder.GetDetailsOf(Item, i));
				}
				info = info.join("");
				if (nWidth && nHeight) {
					s.push('<img src="');
					s.push(Item.Path);
					s.push('" alt="');
					s.push(info);
					s.push(info2.join(""));
					s.push('" style="display: block;');
					s.push(style);
					s.push('" onerror="this.style.display=\'none\'" oncontextmenu="g_preview.Popup(this); return false;" ondrag="g_preview.Drag(); return false">');
				}
				s.push('<div style="font-size: 10px; margin: 0px 4px">');
				s.push(info.replace(/\n/g,"<br>"));
				s.push('</div>');
			}
			else {
				s.push('<div style="font-size: 10px; margin-left: 4px">Preview</div>');
			}
			o.innerHTML = s.join("");//.replace(/</, "&lt;");
			Resize2();
		},

		Popup: function (o)
		{
			if (g_preview.Item) {
				var hMenu = api.CreatePopupMenu();
				var ContextMenu = api.ContextMenu(g_preview.Item);
				if (ContextMenu) {
					ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_NORMAL);
					var pt = api.Memory("POINT");
					api.GetCursorPos(pt);
					var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu);
					if (nVerb) {
						ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 1, null, null, SW_SHOWNORMAL, 0, 0);
					}
				}
				api.DestroyMenu(hMenu);
			}
		},

		Drag: function ()
		{
			var pdwEffect = api.Memory("DWORD");
			pdwEffect.X = DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK;
			api.DoDragDrop(g_preview.Item, pdwEffect.X, pdwEffect);
		}
	}

	if (!te.Data.Conf_LeftBarWidth) {
		te.Data.Conf_LeftBarWidth = 150;
	}
	var px = (te.Data.Conf_LeftBarWidth - 2) + "px";
	var s = '<div id="PreviewBar" style="width: 100%; height: 100%; background-color: window; border: 1px solid WindowFrame; overflow-x: hidden; overflow-y: hidden;"></div>';
	SetAddon(Addon_Id, Default, s);
	g_preview.Arrange();

	AddEvent("SelectionChanged", function (Ctrl)
	{
		if ((Ctrl.Type >> 16) == (CTRL_FV >> 16)) {
			clearTimeout(g_preview.tid);
			if (te.offsetLeft && !document.getElementById('PreviewBar').style.display.match(/none/i)) {
				var Selected = Ctrl.SelectedItems();
				if (Selected.Count == 1) {
					if (g_preview.tid) {
						clearTimeout(g_preview.tid);
					}
					(function (Item) { g_preview.tid = setTimeout(function () {
						g_preview.Arrange(Item);
					}, 500);}) (Selected.Item(0));
				}
			}
		}
	});
}

