if (window.Addon == 1) {
	Addons.PreventAutoArrange = {
		hModule: await api.LoadLibraryEx(BuildPath(ui_.Installed, "addons\\supressautoarrange\\tsaa" + ui_.bit + ".dll"), 0, 0),
		Finalize: function () {
			if (Addons.PreventAutoArrange.hModule) {
				te.RemoveEvent("MessageSFVCB", Addons.PreventAutoArrange.Proc);
				api.FreeLibrary(Addons.PreventAutoArrange.hModule);
				delete Addons.PreventAutoArrange.hModule;
			}
		}
	}

	const hModule = Addons.PreventAutoArrange.hModule;
	if (hModule) {
		Addons.PreventAutoArrange.Proc = await api.GetProcAddress(hModule, "MessageSFVCB");
		te.AddEvent("MessageSFVCB", Addons.PreventAutoArrange.Proc);

		AddEvent("Finalize", Addons.PreventAutoArrange.Finalize);

		AddEvent("AddonDisabled", function (Id) {
			if (SameText(Id, "PreventAutoArrange")) {
				Addons.PreventAutoArrange.Finalize();
			}
		});
	}
}
