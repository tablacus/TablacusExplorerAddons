var Addon_Id = "touch";
var item = GetAddonElement(Addon_Id);

Sync.Touch = {
	strName: GetText(item.getAttribute("MenuName") || "Change the Date modified...") || GetAddonInfo(Addon_Id).Name,

	Exec: function () {
		InvokeUI("Addons.Touch.Exec", arguments);
		return S_OK;
	}
};

//Menu
if (item.getAttribute("MenuExec")) {
	Sync.Touch.nPos = api.LowPart(item.getAttribute("MenuPos"));
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		if (item && item.IsFileSystem) {
			api.InsertMenu(hMenu, Sync.Touch.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.Touch.strName);
			ExtraMenuCommand[nPos] = Sync.Touch.Exec;
		}
		return nPos;
	});
}
