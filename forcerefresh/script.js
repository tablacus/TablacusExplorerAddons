const Addon_Id = "forcerefresh";
if (window.Addon == 1) {
	const item = await GetAddonElement(Addon_Id);
	Addons.ForceRefresh = {
		Filter: await ExtractFilter(item.getAttribute("Filter") || "-"),
		Disable: await ExtractFilter(item.getAttribute("Disable") || "-"),
		Notify: 0,
		Timeout: GetNum(item.getAttribute("Timeout")) || 500,
		db: {},
		tid: {},

		ChangeNotify: async function (FV, pidls, lEvent) {
			if (((lEvent & SHCNE_RENAMEITEM | SHCNE_RENAMEFOLDER) && await api.ILIsParent(FV, await pidls[1], true)) || await api.ILIsParent(FV, await pidls[0], true)) {
				const Id = await FV.Id;
				if (Addons.ForceRefresh.tid[Id]) {
					clearTimeout(Addons.ForceRefresh.tid[Id]);
				}
				Addons.ForceRefresh.tid[Id] = setTimeout(async function (Id) {
					delete Addons.ForceRefresh.tid[Id];
					if (await api.GetClassName(await api.GetFocus()) != WC_EDIT) {
						FV.Refresh();
					}
				}, Addons.ForceRefresh.Timeout, Id);
			}
		}
	};

	let db = {
		"NewFile": SHCNE_CREATE,
		"NewFolder": SHCNE_MKDIR,
		"Delete": SHCNE_DELETE | SHCNE_RMDIR,
		"Rename": SHCNE_RENAMEITEM | SHCNE_RENAMEFOLDER
	}
	for (let n in db) {
		if (GetNum(item.getAttribute(n))) {
			Addons.ForceRefresh.Notify |= db[n];
		}
	}
	delete db;
	if (Addons.ForceRefresh.Notify) {
		AddEvent("ChangeNotify", async function (Ctrl, pidls) {
			const lEvent = await pidls.lEvent;
			if (lEvent & Addons.ForceRefresh.Notify) {
				const cFV = await te.Ctrls(CTRL_FV, false, window.chrome);
				for (let i = cFV.length; --i >= 0;) {
					Addons.ForceRefresh.ChangeNotify(cFV[i], pidls, lEvent);
				}
			}
		});
	}

	AddEvent("SelectionChanged", async function (Ctrl, uChange) {
		if (await Ctrl.Type == CTRL_TC) {
			if (await Ctrl.Selected) {
				const Id = await Ctrl.Id;
				const FV = await te.Ctrl(CTRL_FV, Addons.ForceRefresh.db[Id]);
				if (FV && await FV.Id != await Ctrl.Selected.Id) {
					const path = await api.GetDisplayNameOf(await Ctrl.Selected, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
					if (await PathMatchEx(path, Addons.ForceRefresh.Filter) && !await PathMatchEx(path, Addons.ForceRefresh.Disable)) {
						Ctrl.Selected.Refresh();
					}
				}
				Addons.ForceRefresh.db[Id] = await Ctrl.Selected.Id;
			}
		}
	});

} else {
	const ar = (await ReadTextFile("addons\\" + Addon_Id + "\\options.html")).split(/<!--panel-->/);
	SetTabContents(0, "Tabs", ar[0]);
	SetTabContents(1, "General", ar[1]);
}
