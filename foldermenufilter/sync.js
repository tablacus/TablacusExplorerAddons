const Addon_Id = "foldermenufilter";
const item = GetAddonElement(Addon_Id);

Sync.FolderMenuFilter = {
	Hidden: ExtractFilter(GetAddonOption(Addon_Id, "Hidden") || "-"),
};

AddEvent("FolderMenuAddMenuItem", function (hMenu, mii, FolderItem, bSelect) {
	if (PathMatchEx(FolderItem.Path, Sync.FolderMenuFilter.Hidden)) {
		return S_FALSE;
	}
});
