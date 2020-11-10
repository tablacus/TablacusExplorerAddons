var Addon_Id = "preview";
var item = await GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.Preview = {
		Align: SameText(item.getAttribute("Align"), "Right") ? "Right" : "Left",
		Height: item.getAttribute("Height"),
		TextFilter: GetNum(item.getAttribute("NoTextFilter")) ? "-" : item.getAttribute("TextFilter") || "*.txt;*.ini;*.css;*.js;*.vba;*.vbs",
		Embed: item.getAttribute("Embed") || "*.mp3;*.m4a;*.webm;*.mp4;*.rm;*.ra;*.ram;*.asf;*.wma;*.wav;*.aiff;*.mpg;*.avi;*.mov;*.wmv;*.mpeg;*.swf;*.pdf",
		Extract: GetNum(item.getAttribute("IsExtract")) ? item.getAttribute("Extract") || "*" : "-",
		Width: 0,
		Charset: item.getAttribute("Charset"),
		TextSize: item.getAttribute("TextSize") || 4000,
		TextLimit: item.getAttribute("TextLimit") || 10000000,

		Arrange: async function (Item, Ctrl) {
			if (await api.ILIsEqual(await Addons.Preview.Item, Item)) {
				return;
			}
			Addons.Preview.Item = Item;
			var o = document.getElementById('PreviewBar');
			var s = [];
			if (Item) {
				var infoName = await Item.Name;
				if ("string" === typeof infoName) {
					var info = EncodeSC(infoName + "\n" + (await Item.ExtendedProperty("infotip"))) + "\n";
					if (await Item.IsLink) {
						var path = await Item.ExtendedProperty("linktarget");
						if (path) {
							Item = await api.ILCreateFromPath(path);
						}
					}
					var path = await Item.Path;
					if (Ctrl && path == await Item.Name) {
						path = EncodeSC(BuildPath(await Ctrl.FolderItem.Path, path));
					}
					var nWidth = 0, nHeight = 0;
					if (await PathMatchEx(path, Addons.Preview.TextFilter)) {
						if (await Item.ExtendedProperty("size") <= Addons.Preview.TextLimit) {
							var ado = await OpenAdodbFromTextFile(path, Addons.Preview.Charset);
							if (ado) {
								o.innerText = await ado.ReadText(Addons.Preview.TextSize);
								ado.Close()
								return;
							}
						}
					}
					var style;
					nWidth = await Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 3");
					nHeight = await Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 4");
					if (ui_.IEVer > 6) {
						style = "max-width: 100%; max-height: 100%";
					} else {
						style = nWidth > nHeight ? "width: 100%" : "width: " + (100 * nWidth / nHeight) + "%";
					}
					s.splice(s.length, 0, '<div align="center" id="previewimg1"><img id="previewimg2" src="', path, '" style="display: none;', style, '" title="', info, '" oncontextmenu="Addons.Preview.Popup(this); return false;" ondrag="Addons.Preview.Drag(); return false" onerror="Addons.Preview.FromFile(this)" onload="Addons.Preview.Loaded(this)"></div>');
					if (await api.PathMatchSpec(path, Addons.Preview.Embed)) {
						s.push('<input id="previewplay1" type="button" value=" &#x25B6; " title="Play" onclick="Addons.Preview.Play()"><br>');
					}
					s.push(info.replace(/\n/, "<br>"));
				}
			}
			o.innerHTML = s.join("");
		},

		FromFile: async function (img) {
			img.onerror = null;
			var o = await api.CreateObject("Object");
			o.path = Addons.Preview.Item;
			o.onload = async function (o) {
				var org = Addons.Preview.Item;
				if (org && SameText(await o.path.Path, await org.Path)) {
					var img = document.getElementById("previewimg2");
					img.src = o.out.DataURI();
				}
			}
			o.onerror = async function (o) {
				if (!await IsFolderEx(await o.path) && await api.PathMatchSpec(await o.path.Path, Addons.Preview.Extract)) {
					var Items = await api.CreateObject("FolderItems");
					await Items.AddItem(await o.path);
					te.OnBeforeGetData(await te.Ctrl(CTRL_FV), Items, 11);
					if (await IsExists(await o.path.Path)) {
						o.onerror = null;
						MainWindow.Threads.GetImage(o);
					}
				}
			}
			Threads.GetImage(o);
		},

		Popup: async function (o) {
			if (Addons.Preview.Item) {
				var hMenu = await api.CreatePopupMenu();
				var ContextMenu = await api.ContextMenu(Addons.Preview.Item);
				if (ContextMenu) {
					await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_NORMAL);
					var pt = await api.Memory("POINT");
					await api.GetCursorPos(pt);
					var nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y, await te.hwnd, null, ContextMenu);
					if (nVerb) {
						ContextMenu.InvokeCommand(0, await te.hwnd, nVerb - 1, null, null, SW_SHOWNORMAL, 0, 0);
					}
				}
				api.DestroyMenu(hMenu);
			}
		},

		Drag: function () {
			var pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
			api.SHDoDragDrop(null, Addons.Preview.Item, te, pdwEffect[0], pdwEffect);
		},

		Loaded: async function (o) {
			o.style.display = "block";
			var path = await MainWindow.Addons.Preview.Item.Path;
			if (await api.PathMatchSpec(path, Addons.Preview.Embed)) {
				o.onclick = Addons.Preview.Play;
				o.style.cursor = "pointer";
			}
		},

		Play: async function () {
			var div1 = document.getElementById("PreviewBar");
			var path = await MainWindow.Addons.Preview.Item.Path;
			if (await api.PathMatchSpec(path, "*.wav")) {
				api.PlaySound(path, null, 3);
			} else if (ui_.IEVer >= 11 && await api.PathMatchSpec(path, "*.mp3;*.m4a")) {
				document.getElementById("previewplay1").style.display = "none";
				document.getElementById("previewimg1").innerHTML = '<audio controls autoplay width="100%" height="100%"><source src="' + path + '"></audio>';
			} else if (ui_.IEVer >= 11 && await api.PathMatchSpec(path, "*.webm;*.mp4")) {
				div1.innerHTML = '<video controls autoplay width="100%" height="100%"><source src="' + path + '"></video>';
			} else {
				div1.innerHTML = '<embed width="100%" height="100%" src="' + path + '" autoplay="true"></embed>';
			}
		},

		Init: async function () {
			Addons.Preview.Width = await te.Data["Conf_" + Addons.Preview.Align + "BarWidth"];
			if (!Addons.Preview.Width) {
				Addons.Preview.Width = 178;
				te.Data["Conf_" + Addons.Preview.Align + "BarWidth"] = Addons.Preview.Width;
			}
			SetAddon(Addon_Id, Addons.Preview.Align + "Bar3", '<div id="PreviewBar" class="pane selectable" style="overflow: hidden;"></div>');
			setTimeout(Addons.Preview.Arrange, 99);
		}
	}

	Addons.Preview.Init();

	AddEvent("StatusText", async function (Ctrl, Text, iPart) {
		if (Addons.Preview.Width && !/^none$/i.test(document.getElementById('PreviewBar').style.display)) {
			if ("string" === typeof await Ctrl.Path) {
				Addons.Preview.Arrange(Ctrl);
			} else {1
				var nType = await Ctrl.Type;
				if ((nType == CTRL_SB || nType == CTRL_EB) && Text) {
					if (await Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
						Addons.Preview.Arrange(await Ctrl.SelectedItems().Item(0), Ctrl);
					}
				}
			}
		}
	});

	AddEvent("ToolTip", async function (Ctrl, Index) {
		if (await Ctrl.Type == CTRL_SB && Index >= 0) {
			var Item = await Ctrl.Item(Index);
			if (Item) {
				Addons.Preview.Arrange(Item, Ctrl);
			}
		}
	});

	AddEvent("Resize", async function () {
		var o = document.getElementById('PreviewBar');
		var w = await te.Data["Conf_" + Addons.Preview.Align + "BarWidth"];
		Addons.Preview.Width = w;
		o.style.width = w + "px";
		var h = Addons.Preview.Height || w;
		o.style.height = isFinite(h) ? h + "px" : h;
	});
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
