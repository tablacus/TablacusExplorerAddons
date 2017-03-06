if (window.Addon == 1) {
	AddEvent("FromFile", function (image, file, alt)
	{
		if (image.FromItem(file)) {
			return S_OK;
		}
	});
}
