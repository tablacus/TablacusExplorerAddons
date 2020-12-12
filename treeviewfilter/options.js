SetTabContents(0, "Hidden", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

Addons.TreeViewFilter = {
	AddPath: async function (path) {
		if (!path) {
			return;
		}
		path = await api.GetDisplayNameOf(path, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		if (await api.GetKeyState(VK_SHIFT) < 0) {
			path = BuildPath("*", await fso.GetFileName(path));
		}
		if (path) {
			const ar = [document.F.Hidden.value.replace(/\s+$/, ""), path];
			document.F.Hidden.value = (ar[0] ? ar.join("\n") : path).replace(/^\s+|\s$/g, "");
		}
	},

	BrowseForFolder: async function () {
		const pid = await sha.BrowseForFolder(0, await GetText("Filter"), 0x50);
		if (pid) {
			this.AddPath(await pid.Self);
		}
	},

	BrowseFolder: async function () {
		this.AddPath(await BrowseForFolder(ssfDESKTOP));
	}
}
