Addon_Id = "treeviewfilter";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);
	Addons.TreeViewFilter = {
		Hidden: ExtractFilter(GetAddonOption(Addon_Id, "Hidden") || "-"),

		Refresh: function () {
			var cTV = te.Ctrls(CTRL_TV);
			for (var i = cTV.length; i--;) {
				var TV = cTV[i];
				var FV = TV.FolderView;
				TV.Refresh();
				if (FV) {
					TV.Expand(FV);
				}
			}
		}
	};
	AddEvent("IncludeItem", function (Ctrl, pid)
	{
		return PathMatchEx(pid.Path, Addons.TreeViewFilter.Hidden);
	});

	AddEventId("AddonDisabledEx", Addon_Id, Addons.TreeViewFilter);

	if (Addons.TreeViewFilter.Hidden != te.Data.TreeHiddenFilter) {
		te.Data.TreeHiddenFilter = Addons.TreeViewFilter.Hidden;
		Addons.TreeViewFilter.Refresh();
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
