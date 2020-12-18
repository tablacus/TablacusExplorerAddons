const Addon_Id = "dlldirectory";
if (window.Addon == 1) {
	api.SetDllDirectory(await ExtractPath(te, await GetAddonOption(Addon_Id, "x" + ui_.bit)));
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
