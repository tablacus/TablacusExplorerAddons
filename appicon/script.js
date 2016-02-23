if (window.Addon == 1) {
	var src = ExtractMacro(te, api.PathUnquoteSpaces(GetAddonOption("appicon", "Icon")));
	var hIcon;
	if (REGEXP_IMAGE.test(src)) {
		var image = te.GdiplusBitmap();
		image.FromFile(src);
		hIcon = image.GetHICON();
	} else {
		var hIcon = MakeImgIcon(src, 0, 16);
	}
	api.SendMessage(te.hwnd, WM_SETICON, ICON_SMALL, hIcon);
	AddEventId("AddonDisabledEx", "appicon", function ()
	{
		api.SendMessage(te.hwnd, WM_SETICON, ICON_SMALL, MakeImgIcon(api.GetModuleFileName(null), 0, 16));
	});
}
