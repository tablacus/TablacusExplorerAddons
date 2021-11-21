SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

ChooseFont = async function (o) {
	const lf = await api.Memory("LOGFONT");
	lf.lfFaceName = document.F.Name.value || await MainWindow.DefaultFont.lfFaceName;
	const h = document.F.Size.value;
	lf.lfHeight = h >= 6 && h <= 18 ? - (h * screen.deviceYDPI / 72) : await MainWindow.DefaultFont.lfHeight;
	lf.lfWeight = document.F.Weight.value || await MainWindow.DefaultFont.lfWeight;
	lf.lfCharSet = document.F.CharSet.value || 1;
	const cf = await api.Memory("CHOOSEFONT");
	cf.hwndOwner = await GetTopWindow();
	cf.lpLogFont = lf;
	cf.Flags = 0x1002041;
	cf.nSizeMin = 6;
	cf.nSizeMax = 18;
	if (await api.ChooseFont(cf) && await lf.CharSet != 2) {
		document.F.Name.value = await lf.lfFaceName;
		document.F.Size.value = Math.abs(Math.round(await lf.lfHeight * 72 / screen.deviceYDPI));
		document.F.Weight.value = await lf.lfWeight;
		document.F.CharSet.value = await lf.lfCharSet;
	}
	g_bChanged = true;
}
