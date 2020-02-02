var Addon_Id = "thumbnailengine";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);
	Addons.ThumbnailEngine =
	{
		hModule: api.LoadLibraryEx(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\thumbnailengine\\thumb", api.sizeof("HANDLE") * 8, ".dll"].join("")), 0, 0),

		Finalize: function () {
			if (Addons.ThumbnailEngine.hModule) {
				api.FreeLibrary(Addons.ThumbnailEngine.hModule);
				delete Addons.ThumbnailEngine.hModule;
			}
		}
	}

	var hModule = Addons.ThumbnailEngine.hModule;
	api.RunDLL(hModule, "SetFilterW", 0, 0, item.getAttribute("Filter") || "*", 1);
	api.RunDLL(hModule, "SetInvalidW", 0, 0, item.getAttribute("Invalid") || "-", 1);
	api.RunDLL(hModule, "SetSizeW", 0, 0, item.getAttribute("Size") || 1024, 1);
	api.RunDLL(hModule, "SetFolderW", 0, 0, !api.LowPart(item.getAttribute("NoFolder")), 1);
	api.RunDLL(hModule, "SetTPW", 0, 0, !api.LowPart(item.getAttribute("NoTP")), 1);
	api.RunDLL(hModule, "SetEIW", 0, 0, !api.LowPart(item.getAttribute("NoEI")), 1);

	te.AddEvent("GetImage", api.GetProcAddress(hModule, "GetImage"));

	AddEvent("Finalize", Addons.ThumbnailEngine.Finalize);

	AddEvent("AddonDisabled", function (Id) {
		if (Id.toLowerCase() == "thumbnailengine") {
			Addons.ThumbnailEngine.Finalize();
		}
	});
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}
