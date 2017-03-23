var s= ['<label>Name</label><br />'];
s.push('<input type="text" id="Name" style="width: 100%" /><br />');
s.push('<label>Size</label><br />');
s.push('<input type="text" id="Size" style="width: 100%" /><br />');
s.push('<input type="button" value="Browse..." onclick="ChooseFont(this)" />');
var info = GetAddonInfo(Addon_Id);
SetTabContents(0, info.Name, s);

ChooseFont = function (o)
{
	var lf = api.Memory("LOGFONT");
	lf.lfFaceName = document.F.Name.value || MainWindow.DefaultFont.lfFaceName;
	var h = document.F.Size.value;
	lf.lfHeight = h >= 6 && h <= 18 ? - (h * screen.logicalYDPI / 72) : MainWindow.DefaultFont.lfHeight;
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
	}
	g_bChanged = true;
}
