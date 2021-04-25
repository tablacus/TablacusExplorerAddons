if (window.Addon == 1) {
	Addons.SupressAutoArrange = {
		hModule: await api.LoadLibraryEx(BuildPath(ui_.Installed, "addons\\supressautoarrange\\tsaa" + ui_.bit + ".dll"), 0, 0),
		Finalize: function () {
			if (Addons.SupressAutoArrange.hModule) {
				te.RemoveEvent("MessageSFVCB", Addons.SupressAutoArrange.Proc);
				api.FreeLibrary(Addons.SupressAutoArrange.hModule);
				delete Addons.SupressAutoArrange.hModule;
			}
		}
	}

	const hModule = Addons.SupressAutoArrange.hModule;
	if (hModule) {
		Addons.SupressAutoArrange.Proc = await api.GetProcAddress(hModule, "MessageSFVCB");
		te.AddEvent("MessageSFVCB", Addons.SupressAutoArrange.Proc);

		AddEvent("Finalize", Addons.SupressAutoArrange.Finalize);

		AddEvent("AddonDisabled", function (Id) {
			if (SameText(Id, "supressautoarrange")) {
				Addons.SupressAutoArrange.Finalize();
			}
		});
	}
}
