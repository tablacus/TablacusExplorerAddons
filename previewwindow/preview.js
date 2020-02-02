Addons = {};

MainWindow.RunEvent1("BrowserCreated", document);

Addons.PreviewWindow =
{
	tid: null,
	r: 1,

	FromFile: function () {
		var img = document.getElementById("img1");
		MainWindow.Threads.GetImage({
			path: MainWindow.Addons.PreviewWindow.File,
			img: img,
			Parent: MainWindow.Addons.PreviewWindow,
			onload: function (o) {
				if (o.path == o.Parent.File) {
					o.img.src = o.out.DataURI();
					Addons.PreviewWindow.w = o.out.GetWidth();
					Addons.PreviewWindow.h = o.out.GetHeight();
				}
			},
			onerror: function (o) {
				if (o.path == o.Parent.File) {
					if (api.PathMatchSpec(o.path, o.Parent.Extract)) {
						var FV = te.Ctrl(CTRL_FV);
						var Selected = FV.SelectedItems();
						if (Selected.Count) {
							var Item = Selected.Item(0);
							if (Item.Path == o.path && !IsFolderEx(Item)) {
								var Items = api.CreateObject("FolderItems");
								Items.AddItem(Item);
								te.OnBeforeGetData(FV, Items, 11);
								if (IsExists(o.path)) {
									o.onerror = null;
									MainWindow.Threads.GetImage(o);
								}
							}
						}
					}
				}
			}
		});
		img.onerror = null;
	},

	Loaded: function () {
		document.getElementById("img1").style.display = "";
		var Item = MainWindow.Addons.PreviewWindow.Item;
		var wh = "{6444048F-4C8B-11D1-8B70-080036B11A03} 13";
		var s = api.PSFormatForDisplay(wh, Item.ExtendedProperty(wh), PDFF_DEFAULT);
		if (s) {
			s = ' (' + s + ')';
		} else if (Addons.PreviewWindow.w) {
			s = [' (', Addons.PreviewWindow.w, ' x ', Addons.PreviewWindow.h, ')'].join("");
		}
		document.title = fso.GetFileName(MainWindow.Addons.PreviewWindow.File) + s;
	},

	Change: function (hwnd) {
		var desc = document.getElementById("desc1");
		var img1 = document.getElementById("img1");
		img1.style.display = "none";
		document.title = MainWindow.Addons.PreviewWindow.strName;
		Addons.PreviewWindow.w = 0;
		Addons.PreviewWindow.h = 0;
		if (MainWindow.Addons.PreviewWindow.File) {
			var Item = MainWindow.Addons.PreviewWindow.Item;
			var ar = [];
			var col = ["type", "write", "{6444048F-4C8B-11D1-8B70-080036B11A03} 13"];
			if (!IsFolderEx(Item)) {
				col.push("size");
			}
			for (var i = col.length; i--;) {
				var s = api.PSFormatForDisplay(col[i], Item.ExtendedProperty(col[i]), PDFF_DEFAULT);
				if (s) {
					ar.unshift(" " + api.PSGetDisplayName(col[i]) + ": " + s);
				}
			}
			desc.innerHTML = ar.join("<br>");
			img1.onload = Addons.PreviewWindow.Loaded;
			img1.onerror = Addons.PreviewWindow.FromFile;
			img1.src = MainWindow.Addons.PreviewWindow.File;
		} else {
			desc.innerHTML = "";
		}
		if (!MainWindow.Addons.PreviewWindow.Focus) {
			api.SetForegroundWindow(hwnd);
		}
		Addons.PreviewWindow.GetRect();
	},

	Move: function (nMove, bFocus) {
		MainWindow.Addons.PreviewWindow.Focus = bFocus;
		var FV = te.Ctrl(CTRL_FV);
		var nCount = FV.ItemCount(SVGIO_ALLVIEW);
		var nIndex = (FV.GetFocusedItem() + nMove + nCount) % nCount;
		FV.SelectItem(nIndex, SVSI_SELECT | SVSI_DESELECTOTHERS | SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_NOTAKEFOCUS);
	},

	GetRect: function () {
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

AddEventEx(window, "load", function () {
	ApplyLang(document);
	MainWindow.Addons.PreviewWindow.Arrange()
});

AddEventEx(window, "beforeunload", function () {
	delete MainWindow.Addons.PreviewWindow.dlg;
	Addons.PreviewWindow.GetRect();
});

AddEventEx(window, "resize", Addons.PreviewWindow.GetRect);

AddEventEx(window, "keydown", function (e) {
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

AddEventEx(window, "dblclick", function (e) {
	Addons.PreviewWindow.Move(api.GetKeyState(VK_SHIFT) < 0 ? -1 : 1);
	return true;
});

AddEventEx(window, "mouseup", function (e) {
	if (api.GetKeyState(VK_RBUTTON) < 0) {
		Addons.PreviewWindow.Move(-1);
		return true;
	}
	if (api.GetKeyState(VK_LBUTTON) < 0) {
		Addons.PreviewWindow.Move(1);
		return true;
	}
});
