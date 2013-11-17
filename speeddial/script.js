if (window.Addon == 1) {
	Addons.SpeedDial =
	{
		SAVE: 512,
		DISP: 10,
		PATH: fso.BuildPath(te.Data.DataFolder, "newtab"),
		CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\speeddial.tsv"),
		db: [],
		bSave: false
	}
	try {
		var f = fso.OpenTextFile(Addons.SpeedDial.CONFIG, 1, false, -1);
		var s;
		while (s = f.ReadLine()) {
			Addons.SpeedDial.db.push(s);
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
					f.WriteLine(Addons.SpeedDial.db[i]);
				}
				f.Close();
			}
			catch (e) {}
		}
	});

	AddEvent("ListViewCreated", function (Ctrl)
	{
		if (api.ILIsEqual(Ctrl.FolderItem, Addons.SpeedDial.PATH)) {
			api.SHFileOperation(FO_DELETE, fso.BuildPath(Addons.SpeedDial.PATH, "*.lnk"), null, FOF_NOCONFIRMATION | FOF_NOERRORUI | FOF_SILENT, false);
			var hash = {};
			for (var i in Addons.SpeedDial.db) {
				hash[Addons.SpeedDial.db[i]] = api.QuadPart(hash[Addons.SpeedDial.db[i]]) + 1;
			}
			var keys = [];
			for (var i in hash) {
				keys.push(i);
			}
			keys.sort(function (a, b) {
				return hash[b] - hash[a];
			});
			keys.splice(Addons.SpeedDial.DISP, MAXINT);
			for (var i = 0; i < keys.length; i ++) {
				try {
					var ar = keys[i].split("\t");
					var sc = wsh.CreateShortcut(fso.BuildPath(Addons.SpeedDial.PATH, api.sprintf(9, "%02d_", i + 1) + ar[1].replace(/:/g, "") + ".lnk"));
					sc.TargetPath = ar[0] == "0" ? "Shell:Desktop" : ar[0];
					sc.Save();
				} catch (e) {
				}
			}
		}
		else {
			var path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);
			if (path != "") {
				Addons.SpeedDial.db.unshift([path, api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_INFOLDER)].join("\t"));
				Addons.SpeedDial.db.splice(Addons.SpeedDial.SAVE, MAXINT);
				Addons.SpeedDial.bSave = true;
			}
		}
	});

	HOME_PATH = Addons.SpeedDial.PATH;
	try {
		fso.CreateFolder(Addons.SpeedDial.PATH);
	} catch (e) {
	}
}
