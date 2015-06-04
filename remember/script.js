Addon_Id = "remember";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Save")) {
		item.setAttribute("Save", 1000);
	}
}
if (window.Addon == 1) {
	Addons.Remember =
	{
		db: {},
		ID: ["Time", "ViewMode", "IconSize", "Columns", "SortColumn", "Group", "Path"],
		nFormat: api.QuadPart(GetAddonOption(Addon_Id, "Format")),

		RememberFolder: function (FV)
		{
			if (FV && FV.FolderItem) {
				var path = String(api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX)).toLowerCase();
				if (path == FV.Data.Remember) {
					var col = FV.Columns(Addons.Remember.nFormat);
					if (col) {
						Addons.Remember.db[path] = [new Date().getTime(), FV.CurrentViewMode, FV.IconSize, col, FV.SortColumn(Addons.Remember.nFormat), FV.GroupBy];
					}
				}
			}
		}
	};

	var xml = OpenXml("remember.xml", true, false);
	if (xml) {
		var items = xml.getElementsByTagName('Item');
		for (var i = items.length; i-- > 0;) {
			var item = items[i];
			var ar = [];
			for (var j in Addons.Remember.ID) {
				ar[j] = item.getAttribute(Addons.Remember.ID[j]);
			}
			if (ar[1]) {
				Addons.Remember.db[String(ar.pop()).toLowerCase()] = ar;
			}
		}
		xml = null;
	}

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (Prev) {
				var path = String(api.GetDisplayNameOf(Prev, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX)).toLowerCase();
				Addons.Remember.db[path] = [new Date().getTime(), Ctrl.CurrentViewMode, Ctrl.IconSize, Ctrl.Columns, Ctrl.SortColumn, Ctrl.GroupBy];
			}
			var path = String(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX)).toLowerCase();
			var ar = Addons.Remember.db[path];
			if (ar) {
				fs.ViewMode = ar[1];
				fs.ImageSize = ar[2];
			}
			else if (Ctrl && Ctrl.Items) {
				fs.ViewMode = Ctrl.CurrentViewMode;
				fs.ImageSize = Ctrl.IconSize;
			}
		}
	});

	AddEvent("NavigateComplete", function (Ctrl)
	{
		Ctrl.Data.Remember = String(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX)).toLowerCase();
		var ar = Addons.Remember.db[Ctrl.Data.Remember];
		if (ar) {
			Ctrl.CurrentViewMode(ar[1], ar[2]);
			Ctrl.Columns = ar[3];
			Ctrl.SortColumn = ar[4];
			if (Ctrl.GroupBy && ar[5]) {
				Ctrl.GroupBy = ar[5];
			}
			ar[0] = new Date().getTime();
		}
	});

	AddEvent("ChangeView", Addons.Remember.RememberFolder);
	AddEvent("CloseView", Addons.Remember.RememberFolder);
	AddEvent("Command", Addons.Remember.RememberFolder);
	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		var Ctrl = te.Ctrl(CTRL_FV);
		if (Ctrl) {
			Addons.Remember.RememberFolder(Ctrl);
		}
	});

	AddEvent("SaveConfig", function ()
	{
		Addons.Remember.RememberFolder(te.Ctrl(CTRL_FV));

		var arFV = [];
		for (var path in Addons.Remember.db) {
			if (path) {
				var ar = Addons.Remember.db[path];
				ar.push(path);
				arFV.push(ar);
			}
		}

		arFV.sort(
			function(a, b) {
				return b[0] - a[0];
			}
		);
		var items = te.Data.Addons.getElementsByTagName("remember");
		if (items.length) {
			arFV.splice(items[0].getAttribute("Save"), arFV.length);
		}
		var xml = CreateXml();
		var root = xml.createElement("TablacusExplorer");

		while (arFV.length) {
			var ar = arFV.shift();
			var item = xml.createElement("Item");
			for (var j in Addons.Remember.ID) {
				item.setAttribute(Addons.Remember.ID[j], ar[j] || "");
			}
			root.appendChild(item);
		}
		xml.appendChild(root);
		SaveXmlEx("remember.xml", xml, true);
	});
}
