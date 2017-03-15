if (window.Addon == 1) {
	var src = ExtractMacro(te, api.PathUnquoteSpaces(GetAddonOption("appicon", "Icon")));
	var image = te.WICBitmap().FromFile(src);
	var hIcon = image ? image.GetHICON() : MakeImgIcon(src, 0, 16);
	api.SendMessage(te.hwnd, WM_SETICON, ICON_SMALL, hIcon);
	AddEventId("AddonDisabledEx", "appicon", function ()
	{
		api.SendMessage(te.hwnd, WM_SETICON, ICON_SMALL, api.GetClassLongPtr(te.hwnd, GCLP_HICONSM));
	});
}
