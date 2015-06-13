var Addon_Id = "preview";

if (window.Addon == 1) {
	Addons.Preview = 
	{
		tid: null,
		Align: api.strcmpi(GetAddonOption(Addon_Id, "Align"), "Right") ? "Left" : "Right",
		Width: 0,

		Arrange: function (Item)
		{
			Addons.Preview.Item = Item;
			var o = document.getElementById('PreviewBar');
			var s = [];
			if (Item) {
				var Folder = sha.NameSpace(Item.Parent);
				var info = [Folder.GetDetailsOf(Item, 0), "<br />"];
				var nSize = Item.ExtendedProperty("Size");
				if (nSize) {
					info.push(api.StrFormatByteSize(nSize));
				}
				if (Item.IsLink) {
					var path = Item.ExtendedProperty("linktarget");
					if (path) {
						Item = api.ILCreateFromPath(path);
					}
				}
				var nWidth = 0, nHeight = 0;
				if (document.documentMode >= 11 && api.PathMatchSpec(Item.Path, "*.mp3;*.m4a;*.webm;*.mp4")) {
					s.splice(s.length, 0, '<video controls width="' + this.Width + '" height="' + this.Width + '"><source src="' + Item.Path + '"></video>');
				}
				else if (api.PathMatchSpec(Item.Path, "*.mp3;*.m4a;*.webm;*.mp4;*.rm;*.ra;*.ram;*.asf;*.wma;*.wav;*.aiff;*.mpg;*.avi;*.mov;*.wmv;*.mpeg;*.swf")) {
					s.splice(s.length, 0, '<embed width="' + this.Width + '" height="' + this.Width + '" src="' + Item.Path + '" autoplay="false"></embed>');
				}
				else {
					var s1 = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 13");
					if (s1) {
						info.push(' (' + s1 + ')');
						nWidth = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 3");
						nHeight = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 4");
					}
					var style;
					if (nWidth  > nHeight) {
						style = ["width: ", this.Width, "px; height: ", this.Width * nHeight / nWidth, "px"];
					} else {
						style = ["width: ", this.Width * nWidth / nHeight, "px; height: ", this.Width, "px"];
					}
					if (nWidth && nHeight) {
						s.splice(s.length, 0, '<img src="', Item.Path, '" title="', Folder.GetDetailsOf(Item, 0), "\n", Folder.GetDetailsOf(Item, -1), '" style="display: block;', style.join(""), '" onerror="this.style.display=\'none\'" oncontextmenu="Addons.Preview.Popup(this); return false;" ondrag="Addons.Preview.Drag(); return false">');
					}
					else {
						s.push('<div style="font-size: 10px; margin-left: 4px">', Item.Path, '</div>');
					}
				}
			}
			o.innerHTML = s.join("");
			Resize2();
		},

		Popup: function (o)
		{
			if (Addons.Preview.Item) {
				var hMenu = api.CreatePopupMenu();
				var ContextMenu = api.ContextMenu(Addons.Preview.Item);
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
			api.DoDragDrop(Addons.Preview.Item, pdwEffect.X, pdwEffect);
		},
		
		Init: function ()
		{
			this.Width = te.Data["Conf_" + this.Align + "BarWidth"];
			if (!this.Width) {
				this.Width = 178;
				te.Data["Conf_" + Addons.Preview.Align + "BarWidth"] = this.Width;
			}
			var s = '<div id="PreviewBar" style="width: 100%; height: 100%; background-color: window; border: 1px solid WindowFrame; overflow-x: hidden; overflow-y: hidden;"></div>';
			SetAddon(Addon_Id, this.Align + "Bar3", s);
			setTimeout("Addons.Preview.Arrange();", 99);
		}
	}

	Addons.Preview.Init();

	AddEvent("SelectionChanged", function (Ctrl)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (Addons.Preview.Width && !document.getElementById('PreviewBar').style.display.match(/none/i)) {
				if (Addons.Preview.tid) {
					clearTimeout(Addons.Preview.tid);
				}
				if (Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
					(function (Item) {
						Addons.Preview.tid = setTimeout(function () {
						Addons.Preview.Arrange(Item);
					}, 500);}) (Ctrl.SelectedItems().Item(0));
				}
			}
		}
	});
}
