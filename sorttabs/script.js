const Addon_Id = "sorttabs";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.SortTabs = {
		tid: {},

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				const TC = await FV.Parent;
				const Id = await TC.Id;
				if (Addons.SortTabs.tid[Id]) {
					clearTimeout(Addons.SortTabs.tid[Id]);
					delete Addons.SortTabs.tid[Id];
				}
				let ids = [];
				const nCount = await TC.Count;
				for (let i = 0; i < nCount; ++i) {
					ids.push(TC[i].Id, TC[i].FolderItem);
				}
				if (window.chrome) {
					ids = await Promise.all(ids);
				}
				for (let i = 0; i < nCount; ++i) {
					for (let j = nCount - 1; j > i; --j) {
						if (await api.CompareIDs(0, ids[j * 2 + 1], ids[j * 2 - 1]) < 0) {
							const Id = ids[j * 2];
							ids[j * 2] = ids[j * 2 - 2];
							ids[j * 2- 2] = Id;
							const pid = ids[j * 2 + 1];
							ids[j * 2 + 1] = ids[j * 2 - 1];
							ids[j * 2 - 1] = pid;
						}
					}
				}
				for (let i = 0; i < nCount; ++i) {
					const j = await te.Ctrl(CTRL_FV, ids[i * 2]).Index;
					if (i != j) {
						await TC.Move(j, i);
					}
				}
			}
		}
	};

	if (item.getAttribute("Auto")) {
		AddEvent("ChangeView", async function (Ctrl) {
			const TC = await Ctrl.Parent;
			const Id = TC.Id;
			if (Addons.SortTabs.tid[Id]) {
				clearTimeout(Addons.SortTabs.tid[Id]);
			}
			Addons.SortTabs.tid[Id] = setTimeout(function (TC) {
				Addons.SortTabs.Exec(TC);
			}, 99, TC);
		});
	}

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("SortTabs", item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SortTabs.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SortTabs.Exec, "Async");
	}
	AddTypeEx("Add-ons", "Sort tabs", Addons.SortTabs.Exec);
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="Auto">Auto</label>');
}
