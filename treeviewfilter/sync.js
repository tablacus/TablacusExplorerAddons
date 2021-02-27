const Addon_Id = "treeviewfilter";

const item = GetAddonElement(Addon_Id);
Sync.TreeViewFilter = {
	Hidden: ExtractFilter(item.getAttribute("Hidden") || "-"),

	Refresh: function () {
		const cTV = te.Ctrls(CTRL_TV);
		for (let i = cTV.length; i--;) {
			const TV = cTV[i];
			TV.Refresh();
			try {
				TV.Expand(TV.FolderView);
			} catch (e) { }
		}
	},

	Clear: function () {
		te.Data.TreeHiddenFilter = null;
		Sync.TreeViewFilter.Refresh();
	}
};

AddEvent("IncludeItem", function (Ctrl, pid) {
	return PathMatchEx(pid.Path, Sync.TreeViewFilter.Hidden);
});

AddEventId("AddonDisabledEx", Addon_Id, Sync.TreeViewFilter.Clear);

if (Sync.TreeViewFilter.Hidden != te.Data.TreeHiddenFilter) {
	te.Data.TreeHiddenFilter = Sync.TreeViewFilter.Hidden;
	Sync.TreeViewFilter.Refresh();
}
