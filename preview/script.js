const Addon_Id = "preview";
const item = await GetAddonElement(Addon_Id);

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
			const o = document.getElementById('PreviewBar');
			const s = [];
			if (Item) {
				const infoName = await Item.Name;
				if ("string" === typeof infoName) {
					const info = EncodeSC(infoName + "\n" + (await Item.ExtendedProperty("infotip"))) + "\n";
					if (await Item.IsLink) {
						const path = await Item.ExtendedProperty("linktarget");
						if (path) {
							Item = await api.ILCreateFromPath(path);
						}
					}
					let path = await Item.Path;
					if (Ctrl && path == await Item.Name) {
						path = EncodeSC(BuildPath(await Ctrl.FolderItem.Path, path));
					}
					let nWidth = 0, nHeight = 0;
					if (await PathMatchEx(path, Addons.Preview.TextFilter)) {
						if (await Item.ExtendedProperty("size") <= Addons.Preview.TextLimit) {
							const ado = await OpenAdodbFromTextFile(path, Addons.Preview.Charset);
							if (ado) {
								o.innerText = await ado.ReadText(Addons.Preview.TextSize);
								ado.Close()
								return;
							}
						}
					}
					let style;
					nWidth = await Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 3");
					nHeight = await Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 4");
					if (ui_.IEVer > 6) {
						style = "max-width: 100%; max-height: 100%";
					} else {
						style = nWidth > nHeight ? "width: 100%" : "width: " + (100 * nWidth / nHeight) + "%";
					}
					s.splice(s.length, 0, '<div align="center" id="previewimg1"><img id="previewimg2" src="', path, '" style="display: none;', style, '" title="', info, '" oncontextmenu="Addons.Preview.Popup(event); return false;" ondrag="Addons.Preview.Drag(); return false" onerror="Addons.Preview.FromFile(this)" onload="Addons.Preview.Loaded(this)"></div>');
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
			const o = await api.CreateObject("Object");
			o.path = Addons.Preview.Item;
			o.onload = async function (o) {
				const org = Addons.Preview.Item;
				if (org && SameText(await o.path.Path, await org.Path)) {
					const img = document.getElementById("previewimg2");
					img.src = await o.out.DataURI();
				}
			}
			o.onerror = async function (o) {
				if (!await IsFolderEx(await o.path) && await api.PathMatchSpec(await o.path.Path, Addons.Preview.Extract)) {
					const Items = await api.CreateObject("FolderItems");
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

		Popup: async function (ev) {
			if (Addons.Preview.Item) {
				const hMenu = await api.CreatePopupMenu();
				const ContextMenu = await api.ContextMenu(Addons.Preview.Item);
				if (ContextMenu) {
					await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_NORMAL);
					const x = ev.screenX * ui_.Zoom;
					const y = ev.screenY * ui_.Zoom;
					const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, x, y, ui_.hwnd, null, ContextMenu);
					if (nVerb) {
						ContextMenu.InvokeCommand(0, ui_.hwnd, nVerb - 1, null, null, SW_SHOWNORMAL, 0, 0);
					}
				}
				api.DestroyMenu(hMenu);
			}
		},

		Drag: function () {
			const pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
			api.SHDoDragDrop(null, Addons.Preview.Item, te, pdwEffect[0], pdwEffect);
		},

		Loaded: async function (o) {
			o.style.display = "block";
			const path = await MainWindow.Addons.Preview.Item.Path;
			if (await api.PathMatchSpec(path, Addons.Preview.Embed)) {
				o.onclick = Addons.Preview.Play;
				o.style.cursor = "pointer";
			}
		},

		Play: async function () {
			const div1 = document.getElementById("PreviewBar");
			const path = await MainWindow.Addons.Preview.Item.Path;
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
			} else {
				const nType = await Ctrl.Type;
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
			const Item = await Ctrl.Item(Index);
			if (Item) {
				Addons.Preview.Arrange(Item, Ctrl);
			}
		}
	}, true);

	AddEvent("Resize", async function () {
		const o = document.getElementById('PreviewBar');
		const w = await te.Data["Conf_" + Addons.Preview.Align + "BarWidth"];
		Addons.Preview.Width = w;
		o.style.width = w + "px";
		const h = Addons.Preview.Height || w;
		o.style.height = isFinite(h) ? h + "px" : h;
	});
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
