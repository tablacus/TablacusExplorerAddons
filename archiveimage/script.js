if (window.Addon == 1) {
	Addons.ArchiveImage =
	{
		hModule: api.LoadLibraryEx(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\archiveimage\\arcimg", api.sizeof("HANDLE") * 8, ".dll"].join("")), 0, 0),

		Finalize: function () {
			if (Addons.ArchiveImage.hModule) {
				api.FreeLibrary(Addons.ArchiveImage.hModule);
				delete Addons.ArchiveImage.hModule;
			}
		}
	};

	AddEvent("AddonDisabled", function (Id) {
		if (Id.toLowerCase() == "archiveimage") {
			Addons.ArchiveImage.Finalize();
		}
	});

	if (Addons.ArchiveImage.hModule) {
		te.AddEvent("GetArchive", api.GetProcAddress(Addons.ArchiveImage.hModule, "GetArchive"));
	}
}
