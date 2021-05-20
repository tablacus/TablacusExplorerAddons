const Addon_Id = "pathicon";
let item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {

	Addons.PathIcon = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			const opt = await api.CreateObject("Object");
			const FV = await GetFolderView(Ctrl, pt);
			const Selected = await FV.SelectedItems();
			opt.sPath = await FV.FolderItem.Path;
			const nCount = await Selected.Count;
			for (let i = 0; i < nCount; ++i) {
				if (await Selected.Item(i).IsFolder) {
					opt.sPath = await Selected.Item(i).Path;
					break;
				}
			}
			AddonOptions("pathicon", await Sync.PathIcon.Init, opt);
		}
	}

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("PathIcon", Addons.PathIcon.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.PathIcon.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.PathIcon.Exec, "Async");
	}
	delete item;

	if (WINVER >= 0x600 && await api.IsAppThemed()) {
		AddEvent("Load", function () {
			if (!Addons.ClassicStyle) {
				Sync.PathIcon.SetStyle();
			}
		});
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	arIndex = ["Path", "Small", "Large"];
	importScript("addons\\" + Addon_Id + "\\options.js");
}
