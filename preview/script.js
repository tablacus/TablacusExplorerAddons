const Addon_Id = "preview";
const item = GetAddonElement(Addon_Id);
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
			const img = document.getElementById("previewimg2");
			const desc = document.getElementById("previewdesc1");
			Addons.Preview.Item = Item;
			if (Item) {
				const info = [];
				let infoName;
				try {
					infoName = await Item.Name;
				} catch (e) {
					return;
				}
				if ("string" === typeof infoName) {
					const col = ["Type", "Write", "Dimensions", "System.Photo.Orientation"];
					if (!await IsFolderEx(Item)) {
						col.push("size");
					}
					for (let i = col.length; i--;) {
						const s1 = await api.PSFormatForDisplay(col[i], await Item.ExtendedProperty(col[i]), PDFF_DEFAULT);
						if (s1) {
							info.unshift(EncodeSC(" " + await api.PSGetDisplayName(col[i]) + ": " + s1));
						}
					}
					let path = await Item.ExtendedProperty("linktarget");
					if (path) {
						Item = await api.ILCreateFromPath(path);
					} else {
						path = await Item.Path;
					}
					if (Ctrl && path == await Item.Name) {
						path = EncodeSC(BuildPath(await Ctrl.FolderItem.Path, path));
					}
					if (!await IsCloud(Item)) {
						if (await PathMatchEx(path, Addons.Preview.TextFilter)) {
							if (await Item.ExtendedProperty("Size") <= Addons.Preview.TextLimit) {
								const ado = await OpenAdodbFromTextFile(path, Addons.Preview.Charset);
								if (ado) {
									img.style.display = "none";
									desc.innerText = await ado.ReadText(Addons.Preview.TextSize);
									ado.Close()
									return;
								}
							}
						}
						if (ui_.IEVer > 6) {
							img.style.maxWidth = "100%";
							img.style.maxHeight = document.getElementById("PreviewBar").offsetHeight + "px";
						} else {
							const nWidth = await Item.ExtendedProperty("ImageX");
							const nHeight = await Item.ExtendedProperty("ImageY");
							img.style.width = nWidth > nHeight ? "100%" : (100 * nWidth / nHeight) + "%";
						}
						if (await api.PathMatchSpec(path, Addons.Preview.Embed)) {
							img.style.display = "none";
							info.unshift('<input id="previewplay1" type="button" value=" &#x25B6; " title="' + (await GetTextR("@wmploc.dll,-1800")) + '" onclick="Addons.Preview.Play()">');
							desc.innerHTML = info.join("<br>");
						}
						Addons.Preview.info = info;
						if (!REGEXP_IMAGE.test(path) || (!window.chrome && GetNum(Item.ExtendedProperty("System.Photo.Orientation")) > 1) || !await fso.FileExists(path)) {
							Addons.Preview.FromFile();
						} else {
							img.onerror = Addons.Preview.FromFile;
							img.src = path;
						}
						return;
					}
				}
			}
			img.style.display = "none";
			desc.innerHTML = "";
			Addons.Preview.Item = null;
		},

		FromFile: async function () {
			const img = document.getElementById("previewimg2");
			img.onerror = null;
			const div1 = document.getElementById("PreviewBar");
			const o = await api.CreateObject("Object");
			o.path = Addons.Preview.Item;
			o.cx = Math.max(div1.offsetWidth, div1.offsetHeight);
			o.f = true;
			o.quality = window.chrome ? -2 : -1;
			o.type = GetEncodeType(await o.path.Path);
			o.anime = true;
			o.onload = async function (o) {
				const org = await Addons.Preview.Item;
				const path = await o.path.Path;
				if (org && SameText(path, await org.Path)) {
					const img = document.getElementById("previewimg2");
					img.src = await o.out;
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
						return;
					}
				}
				document.getElementById("previewimg2").style.display = "none";
				document.getElementById("previewdesc1").innerHTML = Addons.Preview.info.join("<br>");
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
			DoDragDrop(Addons.Preview.Item, DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK);
		},

		Loaded: async function (o) {
			o.style.display = "";
			o.title = Addons.Preview.info.join("\n").replace(/<[\w\W]*>\n?/g, "");
			document.getElementById("previewdesc1").innerHTML = Addons.Preview.info.join("<br>");
			const path = await Addons.Preview.Item.ExtendedProperty("linktarget") || await Addons.Preview.Item.Path;
			if (await api.PathMatchSpec(path, Addons.Preview.Embed)) {
				o.onclick = Addons.Preview.Play;
				o.style.cursor = "pointer";
			} else {
				o.onclick = null;
				o.style.cursor = "";
			}
		},

		Play: async function () {
			const div1 = document.getElementById("previewdesc1");
			const path = await Addons.Preview.Item.ExtendedProperty("linktarget") || await Addons.Preview.Item.Path;
			if (!window.chrome && await api.PathMatchSpec(path, "*.wav")) {
				api.PlaySound(path, null, 3);
			} else if (ui_.IEVer >= 11 && await api.PathMatchSpec(path, window.chrome ? "*.mp3;*.m4a;*.wav;*.pcm;*.oga;*.flac;*.fla" : "*.mp3;*.m4a")) {
				div1.innerHTML = '<audio controls autoplay style="width: 100%"><source src="' + path + '"></audio>';
			} else {
				document.getElementById("previewimg2").style.display = "none";
				if (window.chrome || (ui_.IEVer >= 11 && await api.PathMatchSpec(path, "*.mp4"))) {
					div1.innerHTML = '<video controls autoplay style="width: 100%"><source src="' + path + '"></video>';
				} else {
					div1.innerHTML = '<embed width="100%" height="100%" src="' + path + '" autoplay="true"></embed>';
				}
			}
		}
	}

	AddEvent("Layout", async function () {
		Addons.Preview.Width = await te.Data["Conf_" + Addons.Preview.Align + "BarWidth"];
		if (!Addons.Preview.Width) {
			Addons.Preview.Width = 178;
			te.Data["Conf_" + Addons.Preview.Align + "BarWidth"] = Addons.Preview.Width;
		}
		await SetAddon(Addon_Id, Addons.Preview.Align + "Bar3", '<div id="PreviewBar" class="pane selectable" style="overflow: hidden;"><div align="center" id="previewimg1"><img id="previewimg2" oncontextmenu="Addons.Preview.Popup(event); return false;" ondrag="Addons.Preview.Drag(); return false" onload="Addons.Preview.Loaded(this)"></div><div id="previewdesc1" class="selectable" style="width: 100%; height: 100%"></div></div>');
		setTimeout(Addons.Preview.Arrange, 99);
	});

	AddEvent("StatusText", async function (Ctrl, Text, iPart) {
		if (Addons.Preview.Width && !/^none$/i.test(document.getElementById('PreviewBar').style.display)) {
			if ("string" === typeof await Ctrl.Path) {
				Addons.Preview.Arrange(Ctrl);
			} else {
				const nType = await Ctrl.Type;
				if ((nType == CTRL_SB || nType == CTRL_EB) && Text) {
					if (await Ctrl.ItemCount(SVGIO_SELECTION) > 0) {
						Addons.Preview.Arrange(await Ctrl.SelectedItems().Item(0), Ctrl);
					} else {
						document.getElementById("previewimg2").style.display = "none";
						document.getElementById("previewdesc1").innerHTML = "";
						Addons.Preview.Item = null;
					}
				}
			}
		}
	});

	if (!item.getAttribute("NoMouse")) {
		AddEvent("ToolTip", async function (Ctrl, Index) {
			if (await Ctrl.Type == CTRL_SB && Index >= 0) {
				const Item = await Ctrl.Item(Index);
				if (Item) {
					Addons.Preview.Arrange(Item, Ctrl);
				}
			}
		}, true);
	}

	AddEvent("Resize", async function () {
		const o = document.getElementById("PreviewBar");
		const w = await te.Data["Conf_" + Addons.Preview.Align + "BarWidth"];
		Addons.Preview.Width = w;
		o.style.width = w + "px";
		const h = Addons.Preview.Height || w;
		o.style.height = isFinite(h) ? h + "px" : h;
	});
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
