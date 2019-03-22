var Addon_Id = "forcerefresh";
if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);
	Addons.ForceRefresh = {
		Filter: (item.getAttribute("Filter") || "-").replace(/\s+$/, "").replace(/\r\n/g, ";"),
		Disable: (item.getAttribute("Disable") || "-").replace(/\s+$/, "").replace(/\r\n/g, ";"),
		db: {}
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
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}