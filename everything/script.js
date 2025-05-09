const Addon_Id = "everything";
const Default = "ToolBar2Right";
let item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Everything = {
		PATH: "es:",
		iCaret: -1,
		sName: item.getAttribute("MenuName") || "Everything",
		Max: 1000,
		RE: false,
		fncb: {},
		nDog: 0,
		Subfolders: GetNum(item.getAttribute("Subfolders")) ? 1 : 0,
		NewTab: GetNum(item.getAttribute("NewTab")),
		RE: GetNum(item.getAttribute("RE")),

		KeyDown: function (ev) {
			setTimeout(Addons.Everything.ShowButton, 99);
			if (ev.keyCode == VK_RETURN || window.chrome && /^Enter/i.test(ev.key)) {
				Addons.Everything.Search();
				return false;
			}
		},

		Search: async function (s) {
			const FV = await te.Ctrl(CTRL_FV);
			s = s || document.F.everythingsearch.value;
			if (s.length) {
				if (!/path:.+/.test(s) && ((await api.GetAsyncKeyState(VK_SHIFT) < 0 ? 1 : 0) ^ Addons.Everything.Subfolders)) {
					const path = await FV.FolderItem.Path;
					if (/^[A-Z]:\\|^\\\\/i.test(path)) {
						s += " path:" + (await PathQuoteSpaces(path + "\\")).replace(/\\\\$/, "\\");
					}
				}
				FV.Navigate(Addons.Everything.PATH + s, Addons.Everything.NewTab ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER);
			}
		},

		Focus: function (o) {
			o.select();
			if (this.iCaret >= 0) {
				const range = o.createTextRange();
				range.move("character", this.iCaret);
				range.select();
				this.iCaret = -1;
			}
			Addons.Everything.ShowButton();
		},

		Clear: function () {
			document.F.everythingsearch.value = "";
			Addons.Everything.ShowButton();
			document.F.everythingsearch.focus();
		},

		ShowButton: function () {
			if (WINVER < 0x602 || window.chrome) {
				document.getElementById("ButtonEverythingClear").style.display = document.F.everythingsearch.value.length ? "inline" : "none";
			}
		},

		Exec: function () {
			WebBrowser.Focus();
			document.F.everythingsearch.focus();
		}
	};

	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Everything.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Everything.Exec, "Async");
	}

	await $.importScript("addons\\" + Addon_Id + "\\sync.js");

	AddEvent("Layout", async function () {
		const z = screen.deviceYDPI / 96;
		const s = item.getAttribute("Width") || 176;
		const width = GetNum(s) == s ? ((s * z) + "px") : s;
		await SetAddon(Addon_Id, Default, ['<input type="text" name="everythingsearch" placeholder="Everything" onkeydown="return Addons.Everything.KeyDown(event)" onfocus="Addons.Everything.Focus(this)" onblur="Addons.Everything.ShowButton()" style="width:', EncodeSC(width), '; padding-right:', (WINVER < 0x602 || window.chrome ? 32 : 16) * z, 'px; vertical-align: middle"><span style="position: relative"><span id="ButtonEverythingClear" onclick="Addons.Everything.Clear()" class="button" style="font-family: marlett; font-size:', 9 * z, 'px; display: none; position: absolute; left: ', -28 * z, 'px; top:', 4 * z, 'px">r</span>', await GetImgTag({
			onclick: "Addons.Everything.Search()",
			hidefocus: "true",
			style: ['position: absolute; left:', -18 * z, 'px; top:', z, 'px; width:', 16 * z, 'px; height:', 16 * z, 'px'].join(""),
			src: await Sync.Everything.Icon
		}, 16 * z), '</span>'], "middle");
		delete item;
	});

	AddEvent("ChangeView", async function (Ctrl) {
		document.F.everythingsearch.value = await Sync.Everything.GetSearchString(Ctrl);
		Addons.Everything.ShowButton();
	});

	AddTypeEx("Add-ons", "Everything", Addons.Everything.Exec);
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
