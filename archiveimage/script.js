if (window.Addon == 1) {
	AddEvent("FromFile", function (image, file, alt, bECM)
	{
		var ar = [file, alt];
		for (var i in ar) {
			var res = /^(.*\.zip)\\(.*)$/i.exec(ar[i]);
			if (res) {
				if (image.FromArchive(fso.BuildPath(system32, "zipfldr.dll"), "{E88DCCE0-B7B3-11d1-A9F0-00AA0060FA31}", res[1], res[2], bECM)) {
					return S_OK;
				}
			}
		}
	});
}
