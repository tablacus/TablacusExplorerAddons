Addons = {};
Addons.PreviewWindow =
{
	tid: null,
	r: 1,

	FromFile: function ()
	{
		var img1 = document.getElementById("img1");
		img1.onerror = null;
		var o = document.documentElement || document.body;
		var Image = api.CreateObject("WICBitmap").FromFile(te.Data.window.Addons.PreviewWindow.File, o.offsetWidth < o.offsetHeight ? o.offsetWidth : o.offsetHeight);
		if (Image) {
			img1.src = Image.DataURI("image/png");
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
		if (te.Data.window.Addons.PreviewWindow.File) {
			var Item = te.Data.window.Addons.PreviewWindow.Item;
			var wh = "{6444048F-4C8B-11D1-8B70-080036B11A03} 13";
			var s = api.PSFormatForDisplay(wh, Item.ExtendedProperty(wh), PDFF_DEFAULT);
			if (s) {
				s = ' (' + s + ')';
			}
			document.title = te.Data.window.Addons.PreviewWindow.File + s;
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
			img1.src = te.Data.window.Addons.PreviewWindow.File;
		} else {
			document.title = te.Data.window.Addons.PreviewWindow.strName;
			desc.innerHTML = "";
		}
		if (!te.Data.window.Addons.PreviewWindow.Focus) {
			api.SetForegroundWindow(hwnd);
		}
		Addons.PreviewWindow.GetRect();
	},

	Move: function (nMove, bFocus)
	{
		te.Data.window.Addons.PreviewWindow.Focus = bFocus;
		var FV = te.Ctrl(CTRL_FV);
		var nCount = FV.ItemCount(SVGIO_ALLVIEW);
		var nIndex = (FV.GetFocusedItem() + nMove + nCount) % nCount;
		FV.SelectItem(nIndex, SVSI_SELECT | SVSI_DESELECTOTHERS | SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_NOTAKEFOCUS);
	},

	GetRect: function ()
	{
		var rc = api.Memory("RECT");
		var hwnd = api.GetWindow(document);
		var hwnd1 = hwnd;
		while (hwnd1 = api.GetParent(hwnd)) {
			hwnd = hwnd1;
		}
		api.GetWindowRect(hwnd, rc);
		if (te.Data.AddonsData.PreviewWindow.left != rc.Left) {
			te.Data.AddonsData.PreviewWindow.left = rc.Left;
			te.Data.bSaveConfig = true;
		}
		if (te.Data.AddonsData.PreviewWindow.top != rc.Top) {
			te.Data.AddonsData.PreviewWindow.top = rc.Top;
			te.Data.bSaveConfig = true;
		}
		var o = document.documentElement || document.body;
		if (te.Data.AddonsData.PreviewWindow.width != o.offsetWidth) {
			te.Data.AddonsData.PreviewWindow.width = o.offsetWidth;
			te.Data.bSaveConfig = true;
		}
		if (te.Data.AddonsData.PreviewWindow.height != o.offsetHeight) {
			te.Data.AddonsData.PreviewWindow.height = o.offsetHeight;
			te.Data.bSaveConfig = true;
		}
	}
};

AddEventEx(window, "load", function ()
{
	ApplyLang(document);
	te.Data.window.Addons.PreviewWindow.Arrange()
});

AddEventEx(window, "beforeunload", function ()
{
	delete te.Data.window.Addons.PreviewWindow.dlg;
	Addons.PreviewWindow.GetRect();
});

AddEventEx(window, "resize", Addons.PreviewWindow.GetRect);

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
