if (window.Addon == 1) {
	AddEvent("FromFile", function (image, file, alt)
	{
		var i, j, path, arc, hFind;
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
					if (image.FromArchive(fso.BuildPath(system32, "zipfldr.dll"), "{E88DCCE0-B7B3-11d1-A9F0-00AA0060FA31}", arc, path.slice(j).join("\\"))) {
						return S_OK;
					}
					break;
				}
			}
		}
	});
}
