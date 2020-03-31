var Addon_Id = "simpleaddressbar";
var Default = "ToolBar2Center";

var item = GetAddonElement(Addon_Id);
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
		nPos: 0,
		strName: "Simple Address Bar",

		KeyDown: function (o) {
			if (event.keyCode == VK_RETURN) {
				(function (o, str) {
					setTimeout(function () {
						if (str == o.value) {
							var p = GetPos(o);
							var pt = api.Memory("POINT");
							pt.x = screenLeft + p.x;
							pt.y = screenTop + p.y + o.offsetHeight;
							window.Input = str;
							if (ExecMenu(te.Ctrl(CTRL_WB), "Alias", pt, 2) != S_OK) {
								NavigateFV(te.Ctrl(CTRL_FV), str, GetNavigateFlags(), true);
							}
						}
					}, 99);
				})(o, o.value);
			}
		},

		Focus: function () {
			document.F.simpleaddressbar.focus();
			return S_OK;
		}
	};

	AddEvent("ChangeView", function (Ctrl) {
		if (Ctrl.FolderItem && Ctrl.Id == Ctrl.Parent.Selected.Id && Ctrl.Parent.Id == te.Ctrl(CTRL_TC).Id) {
			document.F.simpleaddressbar.value = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		}
	});

	AddEvent("SetAddress", function (s) {
		document.F.addressbar.value = s;
	});

	GetAddress = function () {
		return document.F.simpleaddressbar.value;
	}

	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.SimpleAddressBar.nPos = api.LowPart(item.getAttribute("MenuPos"));
		var s = item.getAttribute("MenuName");
		if (s && s != "") {
			Addons.SimpleAddressBar.strName = s;
		}
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
			api.InsertMenu(hMenu, Addons.SimpleAddressBar.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.SimpleAddressBar.strName));
			ExtraMenuCommand[nPos] = Addons.SimpleAddressBar.Focus;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SimpleAddressBar.Focus, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SimpleAddressBar.Focus, "Func");
	}

	AddTypeEx("Add-ons", "Simple Address Bar", Addons.SimpleAddressBar.Focus);
	var s = '<input id="simpleaddressbar" type="text" autocomplate="on" list="AddressList" oninput="AdjustAutocomplete(this.value)" onkeydown="return Addons.SimpleAddressBar.KeyDown(this)" onfocus="this.select()" style="width: 100%; vertical-align: middle">';
	SetAddon(Addon_Id, Default, s, "middle");
}
