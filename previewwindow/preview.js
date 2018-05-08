Addons = {};
Addons.PreviewWindow =
{
	tid: null,

	FromFile: function ()
	{
		var img1 = document.getElementById("img1");
		img1.onerror = null;
		var Image = api.CreateObject("WICBitmap").FromFile(MainWindow.Addons.PreviewWindow.File);
		if (Image) {
			img1.src = Image.DataURI(/\.jpe?g?$/.test(MainWindow.Addons.PreviewWindow.File) ? "image/jpeg" : "image/png");
		}
	},

	Loaded: function ()
	{
		document.getElementById("img1").style.display = "";
	},

	Change: function (hwnd)
	{
		var desc = document.getElementById("desc1");
		var img1 = document.getElementById("img1");
		img1.style.display = "none";
		if (MainWindow.Addons.PreviewWindow.File) {
			var Item = MainWindow.Addons.PreviewWindow.Item;
			var wh = "{6444048F-4C8B-11D1-8B70-080036B11A03} 13";
			var s = api.PSFormatForDisplay(wh, Item.ExtendedProperty(wh), PDFF_DEFAULT);
			if (s) {
				s = ' (' + s + ')';
			}
			document.title = MainWindow.Addons.PreviewWindow.File + s;
			var ar = [];
			var col = ["name", "write", wh];
			if (!IsFolderEx(Item)) {
				col.push("size");
			}
			for (var i = col.length; i--;) {
				s = api.PSFormatForDisplay(col[i], Item.ExtendedProperty(col[i]), PDFF_DEFAULT);
				if (s) {
					ar.unshift(" " + api.PSGetDisplayName(col[i]) + ": " + s);
				}
			}
			desc.innerHTML = ar.join("<br />");
			img1.onload = Addons.PreviewWindow.Loaded;
			img1.onerror = Addons.PreviewWindow.FromFile;
			img1.src = MainWindow.Addons.PreviewWindow.File;
			img1.style.maxWidth = "100%";
			img1.style.maxHeight = "100vh";
		} else {
			document.title = MainWindow.Addons.PreviewWindow.strName;
			desc.innerHTML = "";
		}
		if (!MainWindow.Addons.PreviewWindow.Focus) {
			api.SetForegroundWindow(hwnd);
		}
	},

	Move: function (nMove, bFocus)
	{
		MainWindow.Addons.PreviewWindow.Focus = bFocus;
		var FV = te.Ctrl(CTRL_FV);
		var nCount = FV.ItemCount(SVGIO_ALLVIEW);
		var nIndex = (FV.GetFocusedItem() + nMove + nCount) % nCount;
		FV.SelectItem(nIndex, SVSI_SELECT | SVSI_DESELECTOTHERS | SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_NOTAKEFOCUS);
	}
};

AddEventEx(window, "load", function ()
{
	ApplyLang(document);
	MainWindow.Addons.PreviewWindow.Arrange()
});

AddEventEx(window, "beforeunload", function ()
{
	delete MainWindow.Addons.PreviewWindow.dlg;
	MainWindow.Addons.PreviewWindow.Width = window.innerWidth;
	MainWindow.Addons.PreviewWindow.Height = window.innerHeight;
});

AddEventEx(window, "keydown", function (e)
{
	if (!e) {
		e = event;
	}
	if (e.keyCode == VK_LEFT || e.keyCode == VK_UP || e.keyCode == VK_BACK) {
		Addons.PreviewWindow.Move(-1, true);
		return true;
	}
	if (e.keyCode == VK_RIGHT || e.keyCode == VK_DOWN || e.keyCode == VK_RETURN || e.keyCode == VK_SPACE) {
		Addons.PreviewWindow.Move(1, true);
		return true;
	}
});

AddEventEx(window, "dblclick", function (e)
{
	Addons.PreviewWindow.Move(api.GetKeyState(VK_SHIFT) < 0 ? -1 : 1);
	return true;
});

AddEventEx(window, "mouseup", function (e)
{
	if (api.GetKeyState(VK_RBUTTON) < 0) {
		Addons.PreviewWindow.Move(-1);
		return true;
	}
	if (api.GetKeyState(VK_LBUTTON) < 0) {
		Addons.PreviewWindow.Move(1);
		return true;
	}
});
