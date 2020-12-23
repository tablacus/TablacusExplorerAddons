const Addon_Id = "foldermenusettings";
if (window.Addon == 1) {
	const item = await GetAddonElement(Addon_Id);
	FolderMenu.SortMode = GetNum(item.getAttribute("Sort"));
	FolderMenu.SortReverse = GetNum(item.getAttribute("Order"));
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
