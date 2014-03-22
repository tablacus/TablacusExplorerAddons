if (window.Addon == 1) {
	Addons.SpeedDial =
	{
		SAVE: 512,
		DISP: 10,
		PATH: "about:newtab",
		CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\speeddial.tsv"),
		db: [],
		bSave: false,
		Prev: null,

		IsHandle: function (Ctrl)
		{
			return api.PathMatchSpec(Ctrl.FolderItem.Path, Addons.SpeedDial.PATH);
		},

		IsDisp: function (path)
		{
			if (!api.PathMatchSpec("\\\\")) {
				if (api.PathMatchSpec(path, "?:\\*")) {
					try {
						var d = fso.GetDrive(fso.GetDriveName(path));
					}
					catch (e) {
						return false;
					}
				}
				return true;
			}
			return false;
		}

	}
	try {
		var f = fso.OpenTextFile(Addons.SpeedDial.CONFIG, 1, false, -1);
		var s;
		while (s = f.ReadLine()) {
			Addons.SpeedDial.db.push(s.replace(/\t.*$/, ""));
		}
		f.Close();
	}
	catch (e) {
		f && f.Close();
	}

	AddEvent("SaveConfig", function ()
	{
		if (Addons.SpeedDial.bSave) {
			try {
				var f = fso.OpenTextFile(Addons.SpeedDial.CONFIG, 2, true, -1);
				for (var i in Addons.SpeedDial.db) {
					var path = Addons.SpeedDial.db[i];
					if (Addons.SpeedDial.IsDisp(path)) {
						f.WriteLine(path);
					}
				}
				f.Close();
			}
			catch (e) {}
		}
	});

	AddEvent("ListViewCreated", function (Ctrl)
	{
		if (Addons.SpeedDial.IsHandle(Ctrl)) {
			setTimeout(function () {
				var keys = [];
				var hash = {};
				for (var i in Addons.SpeedDial.db) {
					var path = Addons.SpeedDial.db[i];
					if (hash[path]) {
						hash[path]++;
					}
					else {
						hash[path] = 1;
					}
				}
				for (var i in hash) {
					keys.push(i);
				}
				keys.sort(function (a, b) {
					return hash[b] - hash[a];
				});
				var Items = Ctrl.Items();
				for (var i = Items.Count; i--;) {
					Ctrl.RemoveItem(Items.Item(i));
				}
				var nDog = Addons.SpeedDial.DISP;
				for (var i = 0; i < keys.length; i++) {
					if (Addons.SpeedDial.IsDisp(keys[i])) {
						Ctrl.AddItem(keys[i]);
						if (!--nDog) {
							break;
						}
					}
				}
			}, 100);
		}
		else {
			var path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			if (path != "" && IsSavePath(path) && Addons.SpeedDial.IsDisp(path)) {
				Addons.SpeedDial.db.unshift(path);
				Addons.SpeedDial.db.splice(Addons.SpeedDial.SAVE, MAXINT);
				Addons.SpeedDial.bSave = true;
			}
		}
	});

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (api.PathMatchSpec(Path, Addons.SpeedDial.PATH)) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("GetTabName", function (Ctrl)
	{
		if (Addons.SpeedDial.IsHandle(Ctrl)) {
			return GetText("New Tab");
		}
	}, true);

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
			if (Addons.SpeedDial.IsHandle(Ctrl)) {
				if ((wParam & 0xfff) == CommandID_DELETE - 1) {
					return S_OK;
				}
			}
		}
	});

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		if (Verb == CommandID_DELETE - 1) {
			var FV = ContextMenu.FolderView;
			if (FV && Addons.SpeedDial.IsHandle(FV)) {
				return S_OK;
			}
		}
	});

	HOME_PATH = Addons.SpeedDial.PATH;
}
