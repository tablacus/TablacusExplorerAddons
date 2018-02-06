if (window.Addon == 1) {
	AddEvent("FromFile", function (image, file, alt, cx)
	{
		if (!fso.FolderExists(file) && image.FromItem(file, cx)) {
			return S_OK;
		}
	});
}
