Sync.SPI = {
	DLL: api.DllGetClassObject(BuildPath(te.Data.Installed, ["addons\\spi\\tspi", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{211571E6-E2B9-446F-8F9F-4DFBE338CE8C}"),
	AM: [],

	Finalize: function () {
		if (Sync.SPI.DLL) {
			if (Sync.SPI.GetImage) {
				te.RemoveEvent("GetImage", Sync.SPI.DLL.GetImage);
			}
			if (Sync.SPI.AM.length) {
				te.RemoveEvent("GetArchive", Sync.SPI.DLL.GetArchive);
				Sync.SPI.AM.length = 0;
			}
			Sync.SPI.DLL.Clear();
			Sync.SPI.DLL = void 0;
			CollectGarbage();
		}
	}
};

AddEvent("AddonDisabled", function (Id) {
	if (SameText(Id, "spi")) {
		Sync.SPI.Finalize();
	}
});
if (Sync.SPI.DLL) {
	Sync.SPI.DLL.Clear();
	const xml = OpenXml("spi" + (api.sizeof("HANDLE") * 8) + ".xml", false, false);
	if (xml) {
		const items = xml.getElementsByTagName("Item");
		for (let i = 0; i < items.length; i++) {
			if (!items[i].getAttribute("Disabled")) {
				const SPI = Sync.SPI.DLL.Open(ExtractPath(te, items[i].getAttribute("Path"))) || {};
				const filter = [];
				if (items[i].getAttribute("Filter")) {
					const s = items[i].getAttribute("UserFilter");
					if (s) {
						filter.push(s);
					} else {
						const ar = [];
						if (SPI.GetPluginInfo) {
							SPI.GetPluginInfo(ar);
						}
						for (let j = 2; j < ar.length; j += 2) {
							const s = ar[j];
							if (/\./.test(s) && !/\*/.test(s)) {
								const ar2 = s.split(/\./);
								for (let k = 1; k < ar2.length; k++) {
									filter.push('*.' + ar2[k]);
								}
							} else {
								filter.push(s);
							}
						}
					}
				} else {
					filter.push("*");
				}
				SPI.Filter = filter.join(";") || "*";
				SPI.IsPreview = items[i].getAttribute("IsPreview") != 0;
				SPI.Preview = items[i].getAttribute("Preview") || "*";
				SPI.Sync = items[i].getAttribute("Sync") ? 1 : 0;
				SPI.IsUnicode = items[i].getAttribute("Ansi") ? 0 : 1;
				if (SPI.GetPicture || (SPI.GetFile && SPI.Preview != "-")) {
					Sync.SPI.GetImage = true;
				}
				if (SPI.GetFile) {
					Sync.SPI.AM.push(SPI);
				}
			}
		}
	}
	delete xml;
	delete SPI;
	if (Sync.SPI.GetImage) {
		te.AddEvent("GetImage", Sync.SPI.DLL.GetImage);
	}
	if (Sync.SPI.AM.length) {
		te.AddEvent("GetArchive", Sync.SPI.DLL.GetArchive);
	}
	Sync.SPI.DLL.SetGetImage(api.GetProcAddress(null, "GetImage"));
}
