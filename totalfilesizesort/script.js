const Addon_Id = "totalfilesizesort";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	Addons.TotalFileSizeSort = {
		Exec: async function(Ctrl, pt) {
			Sync.TotalFileSizeSort.Exec(await GetFolderView(Ctrl, pt));
		}
	};
	await $.importScript("addons\\" + Addon_Id + "\\sync.js");
	SetAddon(Addon_Id, Default, await Sync.TotalFileSizeSort.str);
	api.ObjPutI(Sync.TotalFileSizeSort, "str", null);
} else {
	EnableInner();
}
