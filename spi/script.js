if (window.Addon == 1) {
	Addons.SPI =
	{
		DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\spi\\tspi", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{211571E6-E2B9-446F-8F9F-4DFBE338CE8C}"),
//		DLL: api.DllGetClassObject(['C:\\cpp\\tspi\\Debug\\tspi', api.sizeof("HANDLE") * 8, 'd.dll'].join(""), "{211571E6-E2B9-446F-8F9F-4DFBE338CE8C}"),
		IN: [],
		AM: [],

		Finalize: function ()
		{
			delete Addons.SPI.IN;
			delete Addons.SPI.AM;
			CollectGarbage();
			delete Addons.SPI.DLL;
		}
	};

	AddEvent("FromFile", function (image, file, alt)
	{
		var i, j, path, arc, path2, hFind, dw, SPI, ado;
		if (Addons.SPI.IN.length && /^[A-Z]:\\.+|^\\.+\\.+/i.test(file)) {
			ado = te.CreateObject(api.ADBSTRM);
			try {
				ado.Type = adTypeBinary;
				ado.Open();
				ado.LoadFromFile(file);
				dw = ado.Read(2048);
			} catch (e) {
				dw = undefined;
			}
			ado.Close();
			if (dw !== undefined) {
				for (i = Addons.SPI.IN.length; i-- > 0;) {
					SPI = Addons.SPI.IN[i];
					if (SPI.IsSupported(file, dw)) {
						var phbm = [];
						if (SPI.GetPicture(file, 0, 0, null, phbm, null, 0) == 0) {
							image.FromHBITMAP(phbm[0], 0, 0);
							api.DeleteObject(phbm[0]);
							return S_OK;
						}
					}
				}
			}
		}
		if (Addons.SPI.AM.length) {
			var wfd = api.Memory("WIN32_FIND_DATA");
			var ar = [file, alt];
			for (i in ar) {
				if (ar[i]) {
					path = ar[i].split(/\\/);
					for (j = path.length; --j > 0;) {
						arc = path.slice(0, j).join("\\");
						if (!/^[A-Z]:\\.+|^\\.+\\.+/i.test(arc)) {
							break;
						}
						hFind = api.FindFirstFile(arc, wfd);
						api.FindClose(hFind);
						if (hFind == INVALID_HANDLE_VALUE || wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
							continue;
						}
						ado = te.CreateObject(api.ADBSTRM);
						try {
							ado.Type = adTypeBinary;
							ado.Open();
							ado.LoadFromFile(arc);
							dw = ado.Read(2048);
						} catch (e) {
							dw = undefined;
						}
						ado.Close();

						if (dw !== undefined) {
							path2 = path.slice(j).join("\\");
							for (i = Addons.SPI.AM.length; i-- > 0;) {
								SPI = Addons.SPI.AM[i];
								if (SPI.IsSupported(arc, dw)) {
									var fileinfo = {};
									if (SPI.GetFileInfo(arc, 0, path2, 0x80, fileinfo) == 0) {
										var ppStream = [];
										if (SPI.GetFile(arc, fileinfo.position, ppStream, 0x100, null, 0) == 0) {
											image.FromStream(ppStream[0], path2);
											return S_OK;
										}

									}
								}
							}
						}
						break;
					}
				}
			}
		}
	});

	AddEvent("FromStream", function (image, stream, filename)
	{
		var dw;
		if (Addons.SPI.IN.length) {
			for (var i = Addons.SPI.IN.length; i-- > 0;) {
				var SPI = Addons.SPI.IN[i];
				if (SPI.IsSupported(filename, stream)) {
					var phbm = [];
					if (SPI.GetPicture(stream, 0, 1, null, phbm, null, 0) == 0) {
						image.FromHBITMAP(phbm[0]);
						api.DeleteObject(phbm[0]);
						return S_OK;
					}
				}
			}
		}
	});

	AddEvent("AddonDisabled", function (Id)
	{
		if (Id.toLowerCase() == "spi") {
			Addons.SPI.Finalize();
		}
	});

	if (Addons.SPI.DLL) {
		var xml = OpenXml("spi" + (api.sizeof("HANDLE") * 8) + ".xml", false, false);
		if (xml) {
			var items = xml.getElementsByTagName("Item");
			for (var i = items.length; i-- > 0;) {
				var SPI = Addons.SPI.DLL.open(items[i].getAttribute("Path")) || {};
				if (SPI.GetPicture) {
					Addons.SPI.IN.push(SPI);
				}
				if (SPI.GetFile) {
					Addons.SPI.AM.push(SPI);
				}
			}
		}
		delete xml;
	}
}
