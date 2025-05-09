const Addon_Id = "innersearchbar";
let item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.InnerSearchBar = {
		tid: [],
		search: [],
		iCaret: [],

		Change: function (o, Id) {
			setTimeout(async function () {
				if (o.value.length == 0) {
					const FV = await GetInnerFV(Id);
					if (await IsSearchPath(FV)) {
						CancelFilterView(FV);
					}
				}
			}, 99);
		},

		KeyDown: function (ev, o, Id) {
			setTimeout(function () {
				Addons.InnerSearchBar.ShowButton(Id)
			}, 99);
			if (ev.keyCode == VK_RETURN || window.chrome && /^Enter/i.test(ev.key)) {
				Addons.InnerSearchBar.Search(Id);
				setTimeout(function (o) {
					WebBrowser.Focus();
					o.focus();
				}, 999, o);
				return false;
			}
		},

		Search: async function (Id) {
			const FV = await GetInnerFV(Id);
			const s = document.F.elements["search_" + Id].value;
			if (s.length) {
				FV.Search(s);
			} else {
				CancelFilterView(FV);
			}
			this.ShowButton(Id);
		},

		Focus: function (o, Id) {
			Activate(o, Id);
			o.select();
			if (this.iCaret[Id] >= 0) {
				const range = o.createTextRange();
				range.move("character", this.iCaret[Id]);
				range.select();
				this.iCaret[Id] = -1;
			}
		},

		Clear: function (Id) {
			const el = document.F.elements["search_" + Id]
			el.value = "";
			this.ShowButton(Id);
			el.focus();
		},

		ShowButton: function (Id) {
			if (WINVER < 0x602 || window.chrome) {
				const o = document.F.elements["search_" + Id];
				if (o) {
					document.getElementById("ButtonSearchClear_" + Id).style.display = o.value.length ? "inline" : "none";
				}
			}
		},

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			const o = document.F.elements["search_" + FV.Parent.Id];
			if (o) {
				o.focus();
			}
		}
	};

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("InnerSearchBar", item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.InnerSearchBar.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.InnerSearchBar.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		const z = screen.deviceYDPI / 96;
		const s = item.getAttribute("Width") || 176;
		Addons.InnerSearchBar.Width = GetNum(s) == s ? ((s * z) + "px") : s;
		Addons.InnerSearchBar.Icon = await GetImgTag({
			onclick: "Addons.InnerSearchBar.Search($)",
			hidefocus: "true",
			style: ['position: absolute; left:', -18 * z, 'px; top:', z, 'px'].join(""),
			src: item.getAttribute("Icon") || "icon:general,17"
		}, 16 * z);
		delete item;
	});

	AddEvent("PanelCreated", function (Ctrl, Id) {
		const z = screen.deviceYDPI / 96;
		return SetAddon(null, "Inner1Right_" + Id, ['<input type="text" name="search_', Id, '" placeholder="Search" onkeydown="return Addons.InnerSearchBar.KeyDown(event,this,', Id, ')" onmouseup="Addons.InnerSearchBar.Change(this,', Id, ')" onfocus="Addons.InnerSearchBar.Focus(this, ', Id, ')" style="width: ', EncodeSC(Addons.InnerSearchBar.Width), '; padding-right:', 16 * z, 'px; vertical-align: middle"><span style="position: relative">', Addons.InnerSearchBar.Icon.replace(/\$/g, Id), '<span id="ButtonSearchClear_', Id, '" style="font-family: marlett; font-size:', 9 * z, 'px; display: none; position: absolute; left:', -28 * z, 'px; top:', 4 * z, 'px" class="button" onclick="Addons.InnerSearchBar.Clear(', Id, ')">r</span></span>'].join(""));
	});

	AddEvent("ChangeView2", async function (Ctrl) {
		const Id = await Ctrl.Parent.Id;
		const o = document.F.elements["search_" + Id];
		if (o) {
			const res = /^search\-ms:.*?crumb=([^&]*)/.exec(await Ctrl.FolderItem.Path);
			o.value = res ? unescape(res[1]) : "";
			Addons.InnerSearchBar.ShowButton(Id);
		}
	});

	AddTypeEx("Add-ons", "Inner Search Bar", Addons.InnerSearchBar.Exec);
} else {
	SetTabContents(0, "General", '<table style="width: 100%"><tr><td style="width: 100%"><label>Width</label></td></tr><tr><td><input type="text" name="Width" size="10"></td><td><input type="button" value="Default" onclick="document.F.Width.value=\'\'"></td></tr></table>');
	ChangeForm([["__IconSize", "style/display", "none"]]);
}
