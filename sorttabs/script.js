const Addon_Id = "sorttabs";
let item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.SortTabs = {
		tid: {},

		Exec: async function (Ctrl, pt) {
			Sync.SortTabs.Exec(Ctrl, pt);
		}
	}

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("SortTabs", item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, item.getAttribute("Menu"), item.getAttribute("MenuPos"), "Sync.Sorttabs.Exec");
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SortTabs.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SortTabs.Exec, "Async");
	}

	if (item.getAttribute("Auto")) {
		AddEvent("ChangeView", async function (Ctrl) {
			const TC = await Ctrl.Parent;
			const Id = TC.Id;
			if (Addons.SortTabs.tid[Id]) {
				clearTimeout(Addons.SortTabs.tid[Id]);
			}
			Addons.SortTabs.tid[Id] = setTimeout(function (Ctrl) {
				Sync.SortTabs.Exec(Ctrl);
			}, 99, Ctrl);
		});
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
	delete item;
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
