var Addon_Id = "preview";
var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.Preview =
	{
		Align: api.StrCmpI(item.getAttribute("Align"), "Right") ? "Left" : "Right",
		Height: item.getAttribute("Height"),
		TextFilter: api.LowPart(item.getAttribute("NoTextFilter")) ? "-" : item.getAttribute("TextFilter") || "*.txt;*.ini;*.css;*.js;*.vba;*.vbs",
		Embed: item.getAttribute("Embed") || "*.mp3;*.m4a;*.webm;*.mp4;*.rm;*.ra;*.ram;*.asf;*.wma;*.wav;*.aiff;*.mpg;*.avi;*.mov;*.wmv;*.mpeg;*.swf;*.pdf",
		Extract: api.LowPart(item.getAttribute("IsExtract")) ? item.getAttribute("Extract") || "*" : "-",
		Width: 0,
		Charset: item.getAttribute("Charset"),
		TextSize: item.getAttribute("TextSize") || 4000,
		TextLimit: item.getAttribute("TextLimit") || 10000000,

		Arrange: function (Item, Ctrl) {
			if (api.ILIsEqual(Addons.Preview.Item, Item)) {
				return;
			}
			Addons.Preview.Item = Item;
			var o = document.getElementById('PreviewBar');
			var s = [];
			if (Item) {
				var info = EncodeSC(Item.Name + "\n" + Item.ExtendedProperty("infotip")) + "\n";
				if (Item.IsLink) {
					var path = Item.ExtendedProperty("linktarget");
					if (path) {
						Item = api.ILCreateFromPath(path);
					}
				}
				var path = Item.Path;
				if (Ctrl && path == Item.Name) {
					path = EncodeSC(fso.BuildPath(Ctrl.FolderItem.Path, path));
				}
				var nWidth = 0, nHeight = 0;
				if (PathMatchEx(path, Addons.Preview.TextFilter)) {
					if (Item.ExtendedProperty("size") <= Addons.Preview.TextLimit) {
						var ado = OpenAdodbFromTextFile(path, Addons.Preview.Charset);
						if (ado) {
							o.innerText = ado.ReadText(Addons.Preview.TextSize);
							ado.Close()
							return;
						}
					}
				}
				var style;
				nWidth = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 3");
				nHeight = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 4");
				if (g_.IEVer > 6) {
					style = "max-width: 100%; max-height: 100%";
				} else {
					style = nWidth > nHeight ? "width: 100%" : "width: " + (100 * nWidth / nHeight) + "%";
				}
				s.splice(s.length, 0, '<div align="center" id="previewimg1"><img src="', path, '" style="display: none;', style, '" title="', info, '" oncontextmenu="Addons.Preview.Popup(this); return false;" ondrag="Addons.Preview.Drag(); return false" onerror="Addons.Preview.FromFile(this)" onload="Addons.Preview.Loaded(this)"></div>');
				if (api.PathMatchSpec(path, Addons.Preview.Embed)) {
					s.push('<input id="previewplay1" type="button" value=" &#x25B6; " title="Play" onclick="Addons.Preview.Play()"><br>');
				}
				s.push(info.replace(/\n/, "<br>"));
			}
			o.innerHTML = s.join("");
		},

		FromFile: function (img) {
			img.onerror = null;
			Threads.GetImage({
				path: Addons.Preview.Item,
				img: img,
				Extract: Addons.Preview.Extract,

				onload: function (o) {
					if (o.path === Addons.Preview.Item) {
						o.img.src = o.out.DataURI();
					}
				},
				onerror: function (o) {
					if (!IsFolderEx(o.path) && api.PathMatchSpec(o.path.Path, o.Extract)) {
						var Items = api.CreateObject("FolderItems");
						Items.AddItem(o.path);
						te.OnBeforeGetData(te.Ctrl(CTRL_FV), Items, 11);
						if (IsExists(o.path.Path)) {
							o.onerror = null;
							MainWindow.Threads.GetImage(o);
						}
					}
				}
			});
		},

		Popup: function (o) {
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

		Drag: function () {
			var pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
			api.SHDoDragDrop(null, Addons.Preview.Item, te, pdwEffect[0], pdwEffect);
		},

		Loaded: function (o) {
			o.style.display = "block";
			var path = MainWindow.Addons.Preview.Item.Path;
			if (api.PathMatchSpec(path, Addons.Preview.Embed)) {
				o.onclick = Addons.Preview.Play;
				o.style.cursor = "pointer";
			}
		},

		Play: function () {
			var div1 = document.getElementById("PreviewBar");
			var path = MainWindow.Addons.Preview.Item.Path;
			if (api.PathMatchSpec(path, "*.wav")) {
				api.PlaySound(path, null, 3);
			} else if (document.documentMode >= 11 && api.PathMatchSpec(path, "*.mp3;*.m4a")) {
				document.getElementById("previewplay1").style.display = "none";
				document.getElementById("previewimg1").innerHTML = '<audio controls autoplay width="100%" height="100%"><source src="' + path + '"></audio>';
			} else if (document.documentMode >= 11 && api.PathMatchSpec(path, "*.webm;*.mp4")) {
				div1.innerHTML = '<video controls autoplay width="100%" height="100%"><source src="' + path + '"></video>';
			} else {
				div1.innerHTML = '<embed width="100%" height="100%" src="' + path + '" autoplay="true"></embed>';
			}
		},

		Init: function () {
			this.Width = te.Data["Conf_" + this.Align + "BarWidth"];
			if (!this.Width) {
				this.Width = 178;
				te.Data["Conf_" + this.Align + "BarWidth"] = this.Width;
			}
			SetAddon(Addon_Id, this.Align + "Bar3", '<div id="PreviewBar" class="pane selectable" style="overflow: hidden;"></div>');
			setTimeout(this.Arrange, 99);
		}
	}

	Addons.Preview.Init();

	AddEvent("StatusText", function (Ctrl, Text, iPart) {
		if (Addons.Preview.Width && !/^none$/i.test(document.getElementById('PreviewBar').style.display)) {
			if (Ctrl.Path) {
				Addons.Preview.Arrange(Ctrl);
			} else if (Ctrl.Type <= CTRL_EB && Text) {
				if (Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
					Addons.Preview.Arrange(Ctrl.SelectedItems().Item(0), Ctrl);
				}
			}
		}
	});

	AddEvent("Resize", function () {
		var o = document.getElementById('PreviewBar');
		var w = te.Data["Conf_" + Addons.Preview.Align + "BarWidth"];
		Addons.Preview.Width = w;
		o.style.width = w + "px";
		var h = Addons.Preview.Height || w;
		o.style.height = isFinite(h) ? h + "px" : h;
	});
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}
