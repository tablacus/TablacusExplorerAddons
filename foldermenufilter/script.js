Addon_Id = "foldermenufilter";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);
	Addons.FolderMenuFilter = {
		Hidden: ExtractFilter(GetAddonOption(Addon_Id, "Hidden") || "-"),
	};
	AddEvent("FolderMenuAddMenuItem", function (hMenu, mii, FolderItem, bSelect)
	{
		if (PathMatchEx(FolderItem.Path, Addons.FolderMenuFilter.Hidden)) {
			return S_FALSE;
		}
	});
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
