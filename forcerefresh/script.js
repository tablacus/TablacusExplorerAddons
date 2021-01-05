const Addon_Id = "forcerefresh";
if (window.Addon == 1) {
	const item = await GetAddonElement(Addon_Id);
	Addons.ForceRefresh = {
		Filter: await ExtractFilter(item.getAttribute("Filter") || "-"),
		Disable: await ExtractFilter(item.getAttribute("Disable") || "-"),
		Notify: (GetNum(item.getAttribute("NewFile")) ? SHCNE_CREATE : 0) | (GetNum(item.getAttribute("NewFolder")) ? SHCNE_MKDIR : 0),
		Timeout: GetNum(item.getAttribute("Timeout")) || 500,
		db: {},
		tid: {},

		ChangeNotify: async function (FV, pidls) {
			if (await api.ILIsParent(FV, await pidls[0], true)) {
				const Id = await FV.Id;
				if (Addons.ForceRefresh.tid[Id]) {
					clearTimeout(Addons.ForceRefresh.tid[Id]);
				}
				Addons.ForceRefresh.tid[Id] = setTimeout(function (Id) {
					delete Addons.ForceRefresh.tid[Id];
					FV.Refresh();
				}, Addons.ForceRefresh.Timeout, Id);
			}
		}
	};

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

	AddEvent("ChangeNotify", async function (Ctrl, pidls) {
		if (await pidls.lEvent & Addons.ForceRefresh.Notify) {
			let cFV = await te.Ctrls(CTRL_FV);
			if (window.chrome) {
				cFV = await api.CreateObject("SafeArray", cFV);
			}
			for (var i = cFV.length; --i >= 0;) {
				Addons.ForceRefresh.ChangeNotify(cFV[i], pidls);
			}
		}
	});
} else {
	const ar = (await ReadTextFile("addons\\" + Addon_Id + "\\options.html")).split(/<!--panel-->/);
	SetTabContents(0, "Tabs", ar[0]);
	SetTabContents(1, "General", ar[1]);
}
