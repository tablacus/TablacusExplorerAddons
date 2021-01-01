Sync.ArchiveImage = {
	hModule: api.LoadLibraryEx(BuildPath(te.Data.Installed, ["addons\\archiveimage\\arcimg", api.sizeof("HANDLE") * 8, ".dll"].join("")), 0, 0),

	Finalize: function () {
		if (Sync.ArchiveImage.hModule) {
			te.RemoveEvent("GetArchive", api.GetProcAddress(Sync.ArchiveImage.hModule, "GetArchive"));
			api.FreeLibrary(Sync.ArchiveImage.hModule);
			delete Sync.ArchiveImage.hModule;
		}
	}
};

AddEvent("Finalize", Sync.ArchiveImage.Finalize);

AddEvent("AddonDisabled", function (Id) {
	if (SameText(Id, "archiveimage")) {
		Sync.ArchiveImage.Finalize();
	}
});

if (Sync.ArchiveImage.hModule) {
	te.AddEvent("GetArchive", api.GetProcAddress(Sync.ArchiveImage.hModule, "GetArchive"));
}
