if (window.Addon == 1) {
	te.Data.xmlFolderSettings = OpenXml("foldersettings.xml", false, true);
	Addons.FolderSettings =
	{
		Get: function (Ctrl)
		{
			var items = te.Data.xmlFolderSettings.getElementsByTagName("Item");
			var path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);
			for (var i = items.length; i-- > 0;) {
				var item = items[i];
				if (api.PathMatchSpec(path, item.getAttribute("Filter"))) {
					return item;
				}
			}
		}

	};

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		var item = Addons.FolderSettings.Get(Ctrl);
		if (item) {
			if (item.text.match(/CurrentViewMode\(\s*(\d+)\s*,\s*(\d+)/i)) {
				fs.ViewMode = RegExp.$1;
				fs.ImageSize = RegExp.$2;
			}
			if (item.text.match(/CurrentViewMode\s*=\s*(\d+)/i)) {
				fs.ViewMode = RegExp.$1;
			}
			if (item.text.match(/IconSize\s*=\s*(\d+)/i)) {
				fs.ImageSize = RegExp.$1;
			}
		}
	});

	AddEvent("ListViewCreated", function (Ctrl)
	{
		var item = Addons.FolderSettings.Get(Ctrl);
		if (item && item.text) {
			Exec(Ctrl, item.text, item.getAttribute("Type"), null);
		}
	});

	AddEvent("View", function (Ctrl, hMenu, nPos)
	{
		ExtraMenuCommand[28722] = function (Ctrl)
		{
			ShowDialog("../addons/foldersettings/options.html", {MainWindow: window, te: te, width: 640, height: 480, GetCurrent: true});
		}
		return nPos;
	});
}
