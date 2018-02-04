if (window.Addon == 1) {
	AddEvent("FromFile", function (image, file, alt, cx)
	{
		if (image.FromItem(file, cx)) {
			return S_OK;
		}
	});
}
