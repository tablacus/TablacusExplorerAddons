if (window.Addon == 1) {
	Addons.SPI =
	{
		DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\spi\\tspi", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{211571E6-E2B9-446F-8F9F-4DFBE338CE8C}"),
		IN: [],
		AM: [],

		Finalize: function () {
			if (Addons.SPI.IN.length) {
				te.RemoveEvent("GetImage", Addons.SPI.DLL.GetImage);
				Addons.SPI.IN = [];
			}
			if (Addons.SPI.AM.length) {
				te.RemoveEvent("GetArchive", Addons.SPI.DLL.GetArchive);
				Addons.SPI.AM = [];
			}
			CollectGarbage();
			delete Addons.SPI.DLL;
		}
	};

	AddEvent("AddonDisabled", function (Id) {
		if (Id.toLowerCase() == "spi") {
			Addons.SPI.Finalize();
		}
	});
	if (Addons.SPI.DLL) {
		var xml = OpenXml("spi" + (api.sizeof("HANDLE") * 8) + ".xml", false, false);
		if (xml) {
			var items = xml.getElementsByTagName("Item");
			for (var i = items.length; i-- > 0;) {
				if (!items[i].getAttribute("Disabled")) {
					var SPI = Addons.SPI.DLL.open(api.PathUnquoteSpaces(ExtractMacro(te, items[i].getAttribute("Path")))) || {};
					var filter = [];
					if (items[i].getAttribute("Filter")) {
						var ar = [];
						if (SPI.GetPluginInfo) {
							SPI.GetPluginInfo(ar);
						}
						for (var j = 2; j < ar.length; j += 2) {
							filter.push(ar[j]);
						}
					} else {
						filter.push("*");
					}
					SPI.Filter = filter.join(";");
					SPI.Preview = items[i].getAttribute("Preview");
					if (SPI.GetPicture) {
						Addons.SPI.IN.push(SPI);
					}
					if (SPI.GetFile) {
						Addons.SPI.AM.push(SPI);
					}
				}
			}
		}
		delete xml;
		delete SPI;
		if (Addons.SPI.IN.length) {
			te.AddEvent("GetImage", Addons.SPI.DLL.GetImage);
		}
		if (Addons.SPI.AM.length) {
			te.AddEvent("GetArchive", Addons.SPI.DLL.GetArchive);
		}
		Addons.SPI.DLL.GetImage(api.GetProcAddress(null, "GetImage"));
	}
}
