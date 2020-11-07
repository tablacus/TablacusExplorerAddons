var Addon_Id = "simpleaddressbar";
var item = GetAddonElement(Addon_Id);

Sync.SimpleAddressBar = {
	nPos: 0,
	strName: "Simple address bar" || item.getAttribute("MenuName"),

	Focus: function () {
		api.Invoke(UI.Addons.SimpleAddressBar);
	}
}

if (item.getAttribute("MenuExec")) {
	Sync.SimpleAddressBar.nPos = GetNum(item.getAttribute("MenuPos"));

	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.SimpleAddressBar.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.SimpleAddressBar.strName));
		ExtraMenuCommand[nPos] = Sync.SimpleAddressBar.Focus;
		return nPos;
	});
}
