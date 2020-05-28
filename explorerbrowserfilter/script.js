Addon_Id = "explorerbrowserfilter";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);
	te.ExplorerBrowserFilter = ExtractFilter(GetAddonOption(Addon_Id, "Filter")),

	AddEventId("AddonDisabledEx", Addon_Id, function () {
		te.ExplorerBrowserFilter = null;
	});
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}

	Addons.ExplorerBrowserFilter = {
		AddPath: function (path) {
			if (!path) {
				return;
			}
			path = api.GetDisplayNameOf(path, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			if (api.GetKeyState(VK_SHIFT) < 0) {
				path = fso.BuildPath("*", fso.GetFileName(path));
			}
			if (path) {
				var ar = [document.F.Filter.value.replace(/\s+$/, ""), path];
				document.F.Filter.value = (ar[0] ? ar.join("\n") : path).replace(/^\s+|\s$/g, "");
			}
		},

		BrowseFolder: function () {
			this.AddPath(BrowseForFolder(ssfDESKTOP));
		}
	}
}
