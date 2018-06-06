if (window.Addon == 1) {
	Addons.SPI =
	{
		DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\spi\\tspi", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{211571E6-E2B9-446F-8F9F-4DFBE338CE8C}"),
		IN: [],
		AM: [],

		GetHeader: function (file)
		{
			return api.SHCreateStreamOnFileEx(file, STGM_READ | STGM_SHARE_DENY_NONE, FILE_ATTRIBUTE_NORMAL, false, null);
		},

		Finalize: function ()
		{
			delete Addons.SPI.IN;
			delete Addons.SPI.AM;
			CollectGarbage();
			delete Addons.SPI.DLL;
		}
	};

	AddEvent("FromFile", function (image, file, alt, cx)
	{
		var i, j, path, arc, path2, hFind, dw, SPI, o;
		if (Addons.SPI.IN.length && /^[A-Z]:\\.+|^\\.+\\.+/i.test(file)) {
			dw = null;
			for (i = Addons.SPI.IN.length; i-- > 0;) {
				o = Addons.SPI.IN[i];
				if (api.PathMatchSpec(file, o.Filter)) {
					if (dw === null) {
						dw = Addons.SPI.GetHeader(file);
						if (dw === undefined) {
							break;
						}
					}
					SPI = o.SPI;
					if (SPI.IsSupported(file, dw)) {
						var phbm = [];
						if ((cx || 999) <= 256 && SPI.GetPreview) {
							if (SPI.GetPreview(dw, 0, 1, null, phbm, null, 0) == 0) {
								image.FromHBITMAP(phbm[0]);
								api.DeleteObject(phbm[0]);
								dw.Free();
								return S_OK;
							}
						}
						if (SPI.GetPicture(dw, 0, 1, null, phbm, null, 0) == 0) {
							image.FromHBITMAP(phbm[0]);
							api.DeleteObject(phbm[0]);
							dw.Free();
							return S_OK;
						}
						if ((cx || 999) <= 256 && SPI.GetPreview) {
							if (SPI.GetPreview(file, 0, 0, null, phbm, null, 0) == 0) {
								image.FromHBITMAP(phbm[0], 0, 0);
								api.DeleteObject(phbm[0]);
								dw.Free();
								return S_OK;
							}
						}
						if (SPI.GetPicture(file, 0, 0, null, phbm, null, 0) == 0) {
							image.FromHBITMAP(phbm[0], 0, 0);
							api.DeleteObject(phbm[0]);
							dw.Free();
							return S_OK;
						}
					}
				}
			}
			if (dw) {
				dw.Free();
				dw = null;
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
						if (dw) {
							dw.Free();
						}
						dw = null;
						path2 = path.slice(j).join("\\");
						for (i = Addons.SPI.AM.length; i-- > 0;) {
							o = Addons.SPI.AM[i];
							if (api.PathMatchSpec(arc, o.Filter)) {
								if (dw === null) {
									dw = Addons.SPI.GetHeader(arc);
									if (dw === undefined) {
										break;
									}
								}
								SPI = o.SPI;
								if (SPI.IsSupported(arc, dw)) {
									dw.Free();
									dw = null;
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
						if (dw) {
							dw.Free();
							dw = null;
						}
						break;
					}
				}
			}
		}
	});

	AddEvent("FromStream", function (image, stream, filename, cx)
	{
		var dw;
		if (Addons.SPI.IN.length) {
			for (var i = Addons.SPI.IN.length; i-- > 0;) {
				var o = Addons.SPI.IN[i];
				SPI = o.SPI;
				if (api.PathMatchSpec(filename, o.Filter) && SPI.IsSupported(filename, stream)) {
					var phbm = [];
					if ((cx || 999) <= 256 && SPI.GetPreview) {
						if (SPI.GetPreview(stream, 0, 1, null, phbm, null, 0) == 0) {
							image.FromHBITMAP(phbm[0]);
							api.DeleteObject(phbm[0]);
							return S_OK;
						}
					}
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
				if (!items[i].getAttribute("Disabled")) {
					var SPI = Addons.SPI.DLL.open(api.PathUnquoteSpaces(ExtractMacro(te, items[i].getAttribute("Path")))) || {};
					var ar = [];
					if (SPI.GetPluginInfo) {
						SPI.GetPluginInfo(ar);
					}
					var filter = [];
					for (var j = 2; j < ar.length; j += 2) {
						filter.push(ar[j]);
					}
					var o = { SPI : SPI, Filter: items[i].getAttribute("Filter") ? filter.join(";") || "*" : "*" };
					if (SPI.GetPicture) {
						Addons.SPI.IN.push(o);
					}
					if (SPI.GetFile) {
						Addons.SPI.AM.push(o);
					}
				}
			}
		}
		delete xml;
	}
}
