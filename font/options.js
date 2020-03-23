var info = GetAddonInfo(Addon_Id);
var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(0, "", ado.ReadText(adReadAll));
	ado.Close();
}

ChooseFont = function (o) {
	var lf = api.Memory("LOGFONT");
	lf.lfFaceName = document.F.Name.value || MainWindow.DefaultFont.lfFaceName;
	var h = document.F.Size.value;
	lf.lfHeight = h >= 6 && h <= 18 ? - (h * screen.logicalYDPI / 72) : MainWindow.DefaultFont.lfHeight;
	lf.lfWeight = document.F.Weight.value || MainWindow.DefaultFont.lfWeight;
	lf.lfCharSet = 1;
	var cf = api.Memory("CHOOSEFONT");
	cf.lStructSize = cf.Size;
	cf.hwndOwner = api.GetWindow(document);
	cf.lpLogFont = lf;
	cf.Flags = 0x2041;
	cf.nSizeMin = 6;
	cf.nSizeMax = 18;
	if (api.ChooseFont(cf) && lf.CharSet != 2) {
		document.F.Name.value = lf.lfFaceName;
		document.F.Size.value = Math.abs(Math.round(lf.lfHeight * 72 / screen.logicalYDPI));
		document.F.Weight.value = lf.lfWeight;
	}
	g_bChanged = true;
}
