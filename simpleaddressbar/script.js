var Addon_Id = "simpleaddressbar";
var Default = "ToolBar2Center";

var item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "All");
	item.setAttribute("Key", "Alt+D");
}

if (window.Addon == 1) {
	Addons.SimpleAddressBar =
	{
		KeyDown: function (ev, o) {
			if (ev.keyCode == VK_RETURN || /^Enter/i.test(ev.key)) {
				setTimeout(async function (o, str) {
					if (str == o.value) {
						var pt = GetPos(o, 9);
						$.Input = str;
						if (await ExecMenu(await te.Ctrl(CTRL_WB), "Alias", pt, 2) != S_OK) {
							NavigateFV(await te.Ctrl(CTRL_FV), str, await GetNavigateFlags(), true);
						}
					}
				}, 99, o, o.value);
			}
		},

		Focus: async function () {
			WebBrowser.Focus();
			document.F.simpleaddressbar.focus();
		},

		ContextMenu: function (o) {
			if (!window.chrome) {
				o.select();
			}
		}
	};
	UI.Addons.SimpleAddressBar = Addons.SimpleAddressBar.Focus;

	AddEvent("ChangeView", async function (Ctrl) {
		if (await Ctrl.FolderItem && await Ctrl.Id == await Ctrl.Parent.Selected.Id && await Ctrl.Parent.Id == await te.Ctrl(CTRL_TC).Id) {
			document.F.simpleaddressbar.value = await api.GetDisplayNameOf(await Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		}
	});

	AddEvent("SetAddress", function (s) {
		document.F.simpleaddressbar.value = s;
	});

	AddEvent("GetAddress", function (cb) {
		cb(document.F.simpleaddressbar.value);
	});

	//Key
	if (await item.getAttribute("KeyExec")) {
		SetKeyExec(await item.getAttribute("KeyOn"), await item.getAttribute("Key"), Addons.SimpleAddressBar.Focus, "Async");
	}
	//Mouse
	if (await item.getAttribute("MouseExec")) {
		SetGestureExec(await item.getAttribute("MouseOn"), await item.getAttribute("Mouse"), Addons.SimpleAddressBar.Focus, "Async");
	}

	AddTypeEx("Add-ons", "Simple Address Bar", Addons.SimpleAddressBar.Focus);
	var s = '<input id="simpleaddressbar" type="text" autocomplate="on" list="AddressList" oninput="AdjustAutocomplete(this.value)" onkeydown="return Addons.SimpleAddressBar.KeyDown(event, this)" onfocus="this.select()" oncontextmenu="Addons.SimpleAddressBar.ContextMenu(this)" style="width: 100%; vertical-align: middle">';
	SetAddon(Addon_Id, Default, s, "middle");
	importJScript("addons\\" + Addon_Id + "\\sync.js");
}
