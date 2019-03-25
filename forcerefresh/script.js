var Addon_Id = "forcerefresh";
if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);
	Addons.ForceRefresh = {
		Filter: (item.getAttribute("Filter") || "-").replace(/\s+$/, "").replace(/\r\n/g, ";"),
		Disable: (item.getAttribute("Disable") || "-").replace(/\s+$/, "").replace(/\r\n/g, ";"),
		Notify: api.LowPart(item.getAttribute("NewFile")) ? SHCNE_CREATE : 0 | api.LowPart(item.getAttribute("NewFolder")) ? SHCNE_MKDIR : 0,
		Timeout: api.LowPart(item.getAttribute("Timeout")) || 500,
		db: {},
		tid: {},

		ChangeNotify: function (FV, pidls)
		{
			if (api.ILIsParent(FV, pidls[0], true)) {
				if (Addons.ForceRefresh.tid[FV.Id]) {
					clearTimeout(Addons.ForceRefresh.tid[FV.Id]);
				}
				Addons.ForceRefresh.tid[FV.Id] = setTimeout(function ()
				{
					delete Addons.ForceRefresh.tid[FV.Id];
					FV.Refresh();
				}, Addons.ForceRefresh.Timeout);
			}
		}
	};

	AddEvent("SelectionChanged", function (Ctrl, uChange)
	{
		if (Ctrl.Type == CTRL_TC) {
			if (Ctrl.Selected) {
				var FV = te.Ctrl(CTRL_FV, Addons.ForceRefresh.db[Ctrl.Id]);
				if (FV && FV.Id != Ctrl.Selected.Id) {
					var path = api.GetDisplayNameOf(Ctrl.Selected, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
					if (PathMatchEx(path, Addons.ForceRefresh.Filter) && !PathMatchEx(path, Addons.ForceRefresh.Disable)) {
						Ctrl.Selected.Refresh();
					}
				}
				Addons.ForceRefresh.db[Ctrl.Id] = Ctrl.Selected.Id;
			}
		}
	});

	AddEvent("ChangeNotify", function (Ctrl, pidls)
	{
		if (pidls.lEvent & Addons.ForceRefresh.Notify) {
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				Addons.ForceRefresh.ChangeNotify(cFV[i], pidls);
			}
		}
	});

} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		var ar = ado.ReadText(adReadAll).split(/<!--panel-->/);
		SetTabContents(0, "Tabs", ar[0]);
		SetTabContents(1, "General", ar[1]);
		ado.Close();
	}
}