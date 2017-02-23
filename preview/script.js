var Addon_Id = "preview";

if (window.Addon == 1) {
	Addons.Preview =
	{
		tid: null,
		Align: api.StrCmpI(GetAddonOption(Addon_Id, "Align"), "Right") ? "Left" : "Right",
		Width: 0,

		Arrange: function (Item)
		{
			Addons.Preview.Item = Item;
			var o = document.getElementById('PreviewBar');
			var s = [];
			if (Item) {
				var Folder = sha.NameSpace(Item.Parent);
				var info = Folder.GetDetailsOf(Item, 0) + "<br>" + Folder.GetDetailsOf(Item, -1).replace(/\n/g, "<br>");
				if (Item.IsLink) {
					var path = Item.ExtendedProperty("linktarget");
					if (path) {
						Item = api.ILCreateFromPath(path);
					}
				}
				var nWidth = 0, nHeight = 0;
				if (api.PathMatchSpec(Item.Path, "*.txt;*.css;*.js;*.vbs;*.vba;*.ini")) {
					var ado = OpenAdodbFromTextFile(Item.Path);
					if (ado) {
						o.innerText = ado.ReadText(1024);
						ado.Close()
						return;
					}
				}
				if (document.documentMode >= 11 && api.PathMatchSpec(Item.Path, "*.mp3;*.m4a;*.webm;*.mp4")) {
					s.splice(s.length, 0, '<video controls width="100%" height="100%"><source src="' + Item.Path + '"></video>');
				} else if (api.PathMatchSpec(Item.Path, "*.mp3;*.m4a;*.webm;*.mp4;*.rm;*.ra;*.ram;*.asf;*.wma;*.wav;*.aiff;*.mpg;*.avi;*.mov;*.wmv;*.mpeg;*.swf;*.pdf")) {
					s.splice(s.length, 0, '<embed width="100%" height="100%" src="' + Item.Path + '" autoplay="false"></embed>');
				} else {
					var image, style;
					nWidth = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 3");
					nHeight = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 4");
					if (document.documentMode) {
						style = nWidth  > nHeight ? "max-width: 100%" : "max-width: " + (100 * nWidth / nHeight) + "%";
					} else {
						style = nWidth  > nHeight ? "width: 100%" : "width: " + (100 * nWidth / nHeight) + "%";
					}
					var img = {};
					if (nWidth && nHeight) {
						s.splice(s.length, 0, '<div align="center"><img src="', Item.Path, '" title="', Folder.GetDetailsOf(Item, 0), "\n", Folder.GetDetailsOf(Item, -1), '" style="width 80px;display: block;', style, '" oncontextmenu="Addons.Preview.Popup(this); return false;" ondrag="Addons.Preview.Drag(); return false" onerror="Addons.Preview.FromFile(this.src, this)"></div>');
					} else if (Addons.Preview.FromFile(Item.Path, img)) {
						s.push('<div align="center"><img src="', img.src, '" title="', Folder.GetDetailsOf(Item, 0), "\n", Folder.GetDetailsOf(Item, -1), '" style="display: block;', style, '" onerror="this.style.display=\'none\'" oncontextmenu="Addons.Preview.Popup(this); return false;" ondrag="Addons.Preview.Drag(); return false"/></div>');
					} else {
						s.push('<div style="font-size: 10px; margin-left: 4px">', Item.Path, '</div>');
					}
				}
				s.push(info);
			}
			o.innerHTML = s.join("");
		},

		FromFile: function(path, img)
		{
			var image;
			img.onerror = null;
			if (/^file:/i.test(path)) {
				path = api.PathCreateFromUrl(path);
			}
			if (image = te.WICBitmap().FromFile(path)) {
				var nWidth = image.GetWidth();
				var nHeight = image.GetHeight();
				var o = document.getElementById('PreviewBar');
				if (image.GetFrameCount() < 2 && (nWidth > o.offsetWidth || nHeight > o.offsetWidth)) {
					if (nWidth > nHeight) {
						image = image.GetThumbnailImage(o.offsetWidth, o.offsetWidth * nHeight / nWidth);
					} else {
						image = image.GetThumbnailImage(o.offsetWidth * nWidth / nHeight, o.offsetWidth);
					}
				}
				img.src = image.DataURI(/\.gif$/.test(path) ? 'image/gif' : "image/png");
				return true;
			}
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
			var pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
			api.DoDragDrop(Addons.Preview.Item, pdwEffect[0], pdwEffect);
		},

		Init: function ()
		{
			this.Width = te.Data["Conf_" + this.Align + "BarWidth"];
			if (!this.Width) {
				this.Width = 178;
				te.Data["Conf_" + this.Align + "BarWidth"] = this.Width;
			}
			var s = '<div id="PreviewBar" style="width: 100%; height: auto; background-color: window; border: 1px solid WindowFrame; overflow: hidden; "></div>';
			SetAddon(Addon_Id, this.Align + "Bar3", s);
			setTimeout(Addons.Preview.Arrange, 99);
		}
	}

	Addons.Preview.Init();

	AddEvent("SelectionChanged", function (Ctrl)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (Addons.Preview.Width && !/^none$/i.test(document.getElementById('PreviewBar').style.display)) {
				if (Addons.Preview.tid) {
					clearTimeout(Addons.Preview.tid);
				}
				if (Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
					(function (Item) {
						Addons.Preview.tid = setTimeout(function () {
						Addons.Preview.Arrange(Item);
					}, api.GetKeyState(VK_LBUTTON) < 0 ? 0 : 500);}) (Ctrl.SelectedItems().Item(0));
				}
			}
		}
	});

	AddEvent("Resize", function ()
	{
		var o = document.getElementById('PreviewBar');
		var w = te.Data["Conf_" + Addons.Preview.Align + "BarWidth"];
		Addons.Preview.Width = w;
		o.style.width = w + "px";
		o.style.height = w + "px";
	});
}
