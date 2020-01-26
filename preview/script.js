var Addon_Id = "preview";
var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.Preview =
	{
		Align: api.StrCmpI(item.getAttribute("Align"), "Right") ? "Left" : "Right",
		Height: item.getAttribute("Height"),
		TextFilter: item.getAttribute("TextFilter") || "*.txt;*.ini;*.css;*.js;*.vba;*.vbs",
		Embed: item.getAttribute("Embed") || "*.mp3;*.m4a;*.webm;*.mp4;*.rm;*.ra;*.ram;*.asf;*.wma;*.wav;*.aiff;*.mpg;*.avi;*.mov;*.wmv;*.mpeg;*.swf;*.pdf",
		Extract: item.getAttribute("Extract") || "*",
		Width: 0,

		Arrange: function (Item, Ctrl)
		{
			if (api.ILIsEqual(Addons.Preview.Item, Item)) {
				return;
			}
			Addons.Preview.Item = Item;
			var o = document.getElementById('PreviewBar');
			var s = [];
			if (Item) {
				var info = EncodeSC(Item.Name + "\n" + Item.ExtendedProperty("infotip")) +"\n";
				if (Item.IsLink) {
					var path = Item.ExtendedProperty("linktarget");
					if (path) {
						Item = api.ILCreateFromPath(path);
					}
				}
				if (api.PathMatchSpec(path, Addons.Preview.Extract) && !IsFolderEx(Item)) {
					var Items = api.CreateObject("FolderItems");
					Items.AddItem(Item);
					te.OnBeforeGetData(Ctrl, Items, 11);
				}
				var path = Item.Path;
				if (Ctrl && path == Item.Name) {
					path = EncodeSC(fso.BuildPath(Ctrl.FolderItem.Path, path));
				}
				var nWidth = 0, nHeight = 0;
				if (PathMatchEx(path, Addons.Preview.TextFilter)) {
					if (Item.ExtendedProperty("size") > 99999) {
						f = fso.OpenTextFile(path, 1, false);
						if (f) {
							o.innerText = f.Read(1024);
							f.Close();
							return;
						}
					} else {
						var ado = OpenAdodbFromTextFile(path);
						if (ado) {
							o.innerText = ado.ReadText(1024);
							ado.Close()
							return;
						}
					}
				}
				var style;
				nWidth = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 3");
				nHeight = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 4");
				if (document.documentMode) {
					style = "max-width: 100%; max-height: 100%";
				} else {
					style = nWidth  > nHeight ? "width: 100%" : "width: " + (100 * nWidth / nHeight) + "%";
				}
				if (api.PathMatchSpec(path, Addons.Preview.Embed)) {
					if (document.documentMode >= 11 && api.PathMatchSpec(path, "*.mp3;*.m4a;*.webm;*.mp4")) {
						s.splice(s.length, 0, '<video controls width="100%" height="100%"><source src="' + path + '"></video>');
					} else {
						s.splice(s.length, 0, '<embed width="100%" height="100%" src="' + path + '" autoplay="false"></embed>');
					}
				} else {
					s.splice(s.length, 0, '<div align="center"><img src="', path, '" style="display: block;', style, '" title="', info, '" oncontextmenu="Addons.Preview.Popup(this); return false;" ondrag="Addons.Preview.Drag(); return false" onerror="Addons.Preview.FromFile(this)"></div>');
				}
				s.push(info.replace(/\n/, "<br>"));
			}
			o.innerHTML = s.join("");
		},

		FromFile: function(img)
		{
			Threads.GetImage({
				path: Addons.Preview.GetPath(img),
				img: img,
				callback: function (o)
				{
					o.img.src = o.out.DataURI();
					o.img.style.display = "";
				}
			});
			img.style.display = "none";
			img.onerror = null;
		},

		GetPath: function (o)
		{
			var path = o.src;
			if (/^file:/i.test(path)) {
				path = api.PathCreateFromUrl(path);
			}
			return path;
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
			api.SHDoDragDrop(null, Addons.Preview.Item, te, pdwEffect[0], pdwEffect);
		},

		Init: function ()
		{
			this.Width = te.Data["Conf_" + this.Align + "BarWidth"];
			if (!this.Width) {
				this.Width = 178;
				te.Data["Conf_" + this.Align + "BarWidth"] = this.Width;
			}
			SetAddon(Addon_Id, this.Align + "Bar3", '<div id="PreviewBar" class="pane" style="overflow: hidden;"></div>');
			setTimeout(this.Arrange, 99);
		}
	}

	Addons.Preview.Init();

	AddEvent("StatusText", function (Ctrl, Text, iPart)
	{
		if (Ctrl.Type <= CTRL_EB && Text) {
			if (Addons.Preview.Width && !/^none$/i.test(document.getElementById('PreviewBar').style.display)) {
				if (Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
					Addons.Preview.Arrange(Ctrl.SelectedItems().Item(0), Ctrl);
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
		o.style.height = Addons.Preview.Height || w + "px";
	});
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}