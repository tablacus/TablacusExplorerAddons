var Addon_Id = "folderimage";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);
	Addons.FolderImage =
	{
		hModule: api.LoadLibraryEx(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\folderimage\\fldrimg", api.sizeof("HANDLE") * 8, ".dll"].join("")), 0, 0),

		Finalize: function () {
			if (Addons.FolderImage.hModule) {
				api.FreeLibrary(Addons.FolderImage.hModule);
				delete Addons.FolderImage.hModule;
			}
		}
	}

	api.RunDLL(Addons.FolderImage.hModule, "SetGetImageW", 0, 0, api.sprintf(99, "%llx", api.GetProcAddress(null, "GetImage")), 1);
	api.RunDLL(Addons.FolderImage.hModule, "SetItemsW", 0, 0, api.LowPart(item.getAttribute("Items")) || 30, 1);
	api.RunDLL(Addons.FolderImage.hModule, "SetExpandedW", 0, 0, api.LowPart(item.getAttribute("Expanded")), 1);
	api.RunDLL(Addons.FolderImage.hModule, "SetFilterW", 0, 0, item.getAttribute("Filter") || "*", 1);
	api.RunDLL(Addons.FolderImage.hModule, "SetInvalidW", 0, 0, item.getAttribute("Invalid") || "-", 1);

	te.AddEvent("GetImage", api.GetProcAddress(Addons.FolderImage.hModule, "GetImage"));

	AddEvent("Finalize", Addons.FolderImage.Finalize);

	AddEvent("AddonDisabled", function (Id) {
		if (Id.toLowerCase() == "folderimage") {
			Addons.FolderImage.Finalize();
		}
	});
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}
