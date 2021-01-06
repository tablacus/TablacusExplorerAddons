Addon_Id = "explorerbrowserfilter";

SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

Addons.ExplorerBrowserFilter = {
	AddPath: async function (path) {
		if (!path) {
			return;
		}
		path = await api.GetDisplayNameOf(path, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		if (await api.GetKeyState(VK_SHIFT) < 0) {
			path = BuildPath("*", await fso.GetFileName(path));
		}
		if (path) {
			const ar = [document.F.Filter.value.replace(/\s+$/, ""), path];
			document.F.Filter.value = (ar[0] ? ar.join("\n") : path).replace(/^\s+|\s$/g, "");
		}
	},

	BrowseFolder: async function () {
		this.AddPath(await BrowseForFolder(ssfDESKTOP));
	}
}
