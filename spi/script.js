Addons.SPI =
{
	DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\spi\\tspi", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{211571E6-E2B9-446F-8F9F-4DFBE338CE8C}"),

	Finalize: function () {
		if (Addons.SPI.DLL) {
			if (Addons.SPI.GetImage) {
				te.RemoveEvent("GetImage", Addons.SPI.DLL.GetImage);
			}
			if (Addons.SPI.GetArchive) {
				te.RemoveEvent("GetArchive", Addons.SPI.DLL.GetArchive);
			}
			Addons.SPI.DLL.Clear();
			delete Addons.SPI.DLL;
		}
	}
};
if (window.Addon == 1) {
	AddEvent("AddonDisabled", function (Id) {
		if (Id.toLowerCase() == "spi") {
			Addons.SPI.Finalize();
		}
	});
	if (Addons.SPI.DLL) {
		Addons.SPI.DLL.Clear();
		var xml = OpenXml("spi" + (api.sizeof("HANDLE") * 8) + ".xml", false, false);
		if (xml) {
			var bPreview = false;
			var items = xml.getElementsByTagName("Item");
			for (var i = 0; i < items.length; i++) {
				if (!items[i].getAttribute("Disabled")) {
					var SPI = Addons.SPI.DLL.Open(api.PathUnquoteSpaces(ExtractMacro(te, items[i].getAttribute("Path")))) || {};
					var filter = [];
					if (items[i].getAttribute("Filter")) {
						var s = items[i].getAttribute("UserFilter");
						if (s) {
							filter.push(s);
						} else {
							var ar = [];
							if (SPI.GetPluginInfo) {
								SPI.GetPluginInfo(ar);
							}
							for (var j = 2; j < ar.length; j += 2) {
								filter.push(ar[j]);
							}
						}
					} else {
						filter.push("*");
					}
					SPI.Filter = filter.join(";");
					SPI.Preview = items[i].getAttribute("IsPreview") ? items[i].getAttribute("Preview") || "*" : "-";
					SPI.Sync = items[i].getAttribute("Sync") ? 1 : 0;
					if (SPI.GetPicture || (SPI.GetFile && SPI.Preview != "-")) {
						Addons.SPI.GetImage = true;
					}
					if (SPI.GetFile) {
						Addons.SPI.GetArchive = true;
					}
				}
			}
		}
		delete xml;
		delete SPI;
		Addons.SPI.DLL.GetImage(api.GetProcAddress(null, "GetImage"));
		if (Addons.SPI.GetImage) {
			te.AddEvent("GetImage", Addons.SPI.DLL.GetImage);
		}
		if (Addons.SPI.GetArchive) {
			te.AddEvent("GetArchive", Addons.SPI.DLL.GetArchive);
		}
	}
}
