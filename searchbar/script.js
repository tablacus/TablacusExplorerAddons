const Addon_Id = "searchbar";
const Default = "ToolBar2Right";
let item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuPos", -1);
}

if (window.Addon == 1) {
	Addons.SearchBar = {
		iCaret: -1,

		Change: function () {
			setTimeout(async function () {
				Addons.SearchBar.ShowButton();
				if (document.F.search.value.length == 0) {
					const FV = await te.Ctrl(CTRL_FV);
					if (await IsSearchPath(FV)) {
						CancelFilterView(FV);
					}
				}
			}, 99);
		},

		KeyDown: function (ev, o) {
			setTimeout(Addons.SearchBar.ShowButton, 99);
			if (ev.keyCode == VK_RETURN || window.chrome && /^Enter/i.test(ev.key)) {
				Addons.SearchBar.Search();
				setTimeout(function () {
					WebBrowser.Focus();
					o.focus();
				}, 999, o);
				return false;
			}
		},

		Search: async function () {
			const FV = await te.Ctrl(CTRL_FV);
			const s = document.F.search.value;
			if (s.length) {
				FV.Search(s);
			} else {
				CancelFilterView(FV);
			}
			Addons.SearchBar.ShowButton();
		},

		Focus: function (o) {
			o.select();
			if (this.iCaret >= 0) {
				const range = o.createTextRange();
				range.move("character", this.iCaret);
				range.select();
				this.iCaret = -1;
			}
		},

		Clear: function () {
			document.F.search.value = "";
			this.ShowButton();
			document.F.search.focus();
		},

		ShowButton: function () {
			if (WINVER < 0x602 || window.chrome) {
				document.getElementById("ButtonSearchClear").style.display = document.F.search.value.length ? "inline" : "none";
			}
		},

		Exec: function () {
			WebBrowser.Focus();
			document.F.search.focus();
		}
	};

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("SearchBar", item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SearchBar.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SearchBar.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		const z = screen.deviceYDPI / 96;
		const s = item.getAttribute("Width") || 176;
		const width = GetNum(s) == s ? ((s * z) + "px") : s;
		await SetAddon(Addon_Id, Default, ['<input type="text" name="search" placeholder="Search" onkeydown="return Addons.SearchBar.KeyDown(event, this)" onmouseup="Addons.SearchBar.Change()" onfocus="Addons.SearchBar.Focus(this)" style="width:', EncodeSC(width), '; padding-right:', (WINVER < 0x602 || window.chrome ? 32 : 16) * z, 'px; vertical-align: middle"><span style="position: relative"><span id="ButtonSearchClear" onclick="Addons.SearchBar.Clear()" class="button" style="font-family: marlett; font-size:', 9 * z, 'px; display: none; position: absolute; left:', -28 * z, 'px; top:', 4 * z, 'px" >r</span>', await GetImgTag({
			onclick: "Addons.SearchBar.Search()",
			hidefocus: "true",
			style: ['position: absolute; left:', -18 * z, 'px; top:', z, 'px'].join(""),
			src: item.getAttribute("Icon") || "icon:general,17"
		}, 16 * z), '</span>'], "middle");
		delete item;
	});

	AddEvent("ChangeView1", async function (Ctrl) {
		const res = /^search\-ms:.*?crumb=([^&]*)/.exec(await Ctrl.FolderItem.Path);
		document.F.search.value = res ? unescape(res[1]) : "";
		Addons.SearchBar.ShowButton();
	});

	AddTypeEx("Add-ons", "Search Bar", Addons.SearchBar.Exec);
} else {
	SetTabContents(0, "View", '<table><tr><td><label>Width</label></td></tr><tr><td><input type="text" name="Width" size="10"></td><td><input type="button" value="Default" onclick="SetDefault(document.F.Width, \'\')"></td></tr></table>');
	ChangeForm([["__IconSize", "style/display", "none"]]);
}
