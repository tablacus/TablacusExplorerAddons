const Addon_Id = "innerfilterbar";
let item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.InnerFilterBar = {
		tid: [],
		filter: [],
		iCaret: [],
		Width: GetWidth(item.getAttribute("Width")) || '176px',
		IconS: item.getAttribute("Icon") ? 16 : 13,
		RE: item.getAttribute("RE"),

		KeyDown: function (ev, o, Id) {
			const k = ev.keyCode;
			if (k != VK_PROCESSKEY) {
				this.filter[Id] = o.value;
				clearTimeout(this.tid[Id]);
				if (k == VK_RETURN) {
					this.Change(Id, ev.ctrlKey);
					return false;
				} else {
					this.tid[Id] = setTimeout("Addons.InnerFilterBar.Change(" + Id + ")", 500);
				}
			}
		},

		KeyUp: function (ev, Id) {
			if (ev.isComposing || !window.chrome) {
				return;
			}
			const k = ev.keyCode;
			if (k == VK_UP || k == VK_DOWN) {
				(async function () {
					const TC = await te.Ctrl(CTRL_TC, Id);
					if (TC) {
						const FV = await TC.Selected;
						if (FV) {
							FV.Focus();
						}
					}
				})();
				return false;
			}
		},

		Change: async function (Id, bSearch) {
			const o = document.F["filter_" + Id];
			Addons.InnerFilterBar.ShowButton(o, Id);
			const FV = await GetInnerFV(Id);
			let s = o.value;
			const res = await IsSearchPath(FV, true);
			if (res || bSearch) {
				if (!res || unescape(await res[1]) != s) {
					if (s) {
						FV.Search(s);
					} else {
						CancelFilterView(FV);
					}
					setTimeout(function (o) {
						if (o == document.activeElement) {
							WebBrowser.Focus();
							o.focus();
						}
					}, 999, o);
				}
				return;
			}
			if (s) {
				if (Addons.InnerFilterBar.RE && !/^\*|\//.test(s)) {
					s = "/" + s + "/i";
				} else {
					if (!/^\//.test(s)) {
						const ar = s.split(/;/);
						for (let i in ar) {
							const res = /^([^\*\?]+)$/.exec(ar[i]);
							if (res) {
								ar[i] = "*" + res[1] + "*";
							}
						}
						s = ar.join(";");
					}
				}
			}
			SetFilterView(FV, s);
		},

		Focus: async function (o, Id) {
			Activate(o, Id);
			if (!await IsSearchPath(await GetInnerFV(Id))) {
				o.select();
			}
			if (this.iCaret[Id] >= 0) {
				const range = o.createTextRange();
				range.move("character", this.iCaret[Id]);
				range.select();
				this.iCaret[Id] = -1;
			}
		},

		Clear: async function (flag, Id) {
			const o = document.F.elements["filter_" + Id];
			o.value = "";
			this.ShowButton(o, Id);
			if (flag) {
				const FV = await GetInnerFV(Id);
				SetFilterView(FV);
				FV.Focus();
			}
			o.focus();
		},

		ShowButton: function (oFilter, Id) {
			if (WINVER < 0x602 || window.chrome) {
				document.getElementById("ButtonFilterClear_" + Id).style.display = oFilter.value.length ? "inline" : "none";
			}
		},

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			const o = document.F.elements["filter_" + await FV.Parent.Id];
			if (o) {
				WebBrowser.Focus();
				o.focus();
			}
			return S_OK;
		},

		GetFilter: async function (Ctrl) {
			if (await Ctrl.Type <= CTRL_EB) {
				const Id = await Ctrl.Parent.Id;
				const o = document.F.elements["filter_" + Id];
				if (o) {
					clearTimeout(Addons.InnerFilterBar.tid[Id]);
					const bSearch = await IsSearchPath(Ctrl, true);
					const s = Addons.InnerFilterBar.GetString(bSearch ? unescape(await bSearch[1]) : await Ctrl.FilterView, bSearch);
					if (s != Addons.InnerFilterBar.GetString(o.value, bSearch)) {
						o.value = s;
						Addons.InnerFilterBar.ShowButton(o, Id);
					}
				}
			}
		},

		GetString: function (s, bSearch) {
			if (bSearch) {
				return s;
			}
			if (Addons.InnerFilterBar.RE) {
				const res = /^\/(.*)\/i/.exec(s);
				if (res) {
					s = res[1];
				}
			} else if (s && !/^\//.test(s)) {
				const ar = s.split(/;/);
				for (let i in ar) {
					const res = /^\*([^/?/*]+)\*$/.exec(ar[i]);
					if (res) {
						ar[i] = res[1];
					}
				}
				s = ar.join(";");
			}
			return s;
		},

		FilterList: function (o, id) {
			if (Addons.FilterList) {
				Addons.FilterList.Exec(o, null, id);
			}
			return false;
		},

		MouseDown: function (ev) {
			Addons.InnerFilterBar.ptDown = { x: ev.screenX, y: ev.screenY };
		},

		MouseUp: function (ev, o, id) {
			if (ev.screenX == Addons.InnerFilterBar.ptDown.x && ev.screenY == Addons.InnerFilterBar.ptDown.y) {
				Addons.InnerFilterBar.FilterList(o, id);
			}
		},
	};

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("InnerFilterBar", item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.InnerFilterBar.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.InnerFilterBar.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		const z = screen.deviceYDPI / 96;
		const h = Addons.InnerFilterBar.IconS;
		Addons.InnerFilterBar.Icon = await GetImgTag({
			id: "ButtonFilter_$",
			style: ['position: absolute; left:', -18 * z, 'px; top:', (18 - h) / 2 * z, 'px'].join(""),
			onmousedown: "Addons.InnerFilterBar.MouseDown(event); return false",
			onmouseup: "Addons.InnerFilterBar.MouseUp(event, this, $)",
			oncontextmenu: "return false",
			src: item.getAttribute("Icon") || (WINVER >= 0xa00 ? "font:Segoe MDL2 Assets,0xe71c" : "bitmap:comctl32.dll,140,13,0")
		}, h * z);
		delete item;
	});

	AddEvent("PanelCreated", function (Ctrl, Id) {
		const z = screen.deviceYDPI / 96;
		const s = ['<input type="text" name="filter_', Id, '" placeholder="Filter" onkeydown="return Addons.InnerFilterBar.KeyDown(event, this,', Id, ')"  onkeyup="return Addons.InnerFilterBar.KeyUp(event,', Id, ')" onmouseup="Addons.InnerFilterBar.KeyDown(event, this,', Id, ')" onfocus="Addons.InnerFilterBar.Focus(this,', Id, ')" onblur="Addons.InnerFilterBar.ShowButton(this,', Id, ')" ondblclick="return Addons.InnerFilterBar.FilterList(this,', Id, ', 1)" style="width: ', EncodeSC(Addons.InnerFilterBar.Width), '; padding-right: ', Addons.InnerFilterBar.IconS * z, 'px; vertical-align: middle"><span style="position: relative">', Addons.InnerFilterBar.Icon.replace(/\$/g, Id), '<span id="ButtonFilterClear_', Id, '" style="font-family: marlett; font-size:', 9 * z, 'px; display: none; position: absolute; left:', -28 * z, 'px; top: ', 4 * z, 'px" class="button" onclick="Addons.InnerFilterBar.Clear(true,', Id, ')">r</span></span>'];
		SetAddon(null, "Inner1Right_" + Id, s.join(""));
	});

	AddEvent("ChangeView2", Addons.InnerFilterBar.GetFilter);

	AddEvent("Command", Addons.InnerFilterBar.GetFilter);

	AddTypeEx("Add-ons", "Inner Filter Bar", Addons.InnerFilterBar.Exec);
} else {
	SetTabContents(0, "General", '<table style="width: 100%"><tr><td><label>Width</label></td></tr><tr><td><input type="text" name="Width" size="10"></td><td><input type="button" value="Default" onclick="document.F.Width.value=\'\'"></td></tr><tr><td><label>Filter</label></td></tr><tr><td><input type="checkbox" id="RE" name="RE"><label for="RE">Regular Expression</label>/<label for="RE">Migemo</label></td></tr></table>');
	ChangeForm([["__IconSize", "style/display", "none"]]);
}
