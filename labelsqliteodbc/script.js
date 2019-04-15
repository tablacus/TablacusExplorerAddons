Addons.LabelSQLiteOdbc =
{
	db: new ActiveXObject("ADODB.Connection"),
	DBFILE: fso.BuildPath(te.Data.DataFolder, "config\\label.db"),

	MakeList: function ()
	{
		var db = Addons.LabelSQLiteOdbc.GetDB();
		var list = [];
		var rs = db.Execute('SELECT label FROM labels');
		var ix = [];
		while (!rs.EOF) {
			var s = rs.Fields(0).value.toString() || "";
			var ar = s.split(/\s*;\s*/);
			for (var i in ar) {
				var s = ar[i];
				if (s) {
					ix.push(s);
				}
			}
			rs.MoveNext();
		}
		var ix = ix.sort(function (a, b) {
			return api.StrCmpLogical(b, a)
		});
		for (var i = ix.length; i--;) {
			list[ix[i]] = true;
		}
		db.Execute("CREATE TABLE IF NOT EXISTS list (label TEXT);");
		db.Execute('DELETE FROM list');
		for (var i in list) {
			db.Execute('INSERT INTO list(label) VALUES ("' + i + '");');
		}
	},

	Open: function ()
	{
		Addons.LabelSQLiteOdbc.db.Open("DRIVER=SQLite3 ODBC Driver;Database=" + Addons.LabelSQLiteOdbc.DBFILE);
		Addons.LabelSQLiteOdbc.db.Execute("CREATE TABLE IF NOT EXISTS labels (path TEXT, label TEXT);");
		Addons.LabelSQLiteOdbc.Open = function () {};
		AddEvent("Finalize", Addons.LabelSQLiteOdbc.Close);
	},

	Close: function ()
	{
		if (Addons.LabelSQLiteOdbc.db) {
			Addons.LabelSQLiteOdbc.db.Close();
			delete Addons.LabelSQLiteOdbc.db;
		}
	},

	GetDB: function ()
	{
		if (MainWindow.Addons.LabelSQLiteOdbc) {
			return MainWindow.Addons.LabelSQLiteOdbc.db;
		}
		Addons.LabelSQLiteOdbc.Open();
		return Addons.LabelSQLiteOdbc.db;
	},

	Load: function (fn)
	{
		try {
			var db = Addons.LabelSQLiteOdbc.GetDB();
			var ado = te.CreateObject("Adodb.Stream");
			ado.CharSet = "utf-8";
			ado.Open();
			ado.LoadFromFile(fn);
			if (!ado.EOS) {
				db.Execute('DELETE FROM labels');
				var n = 0;
				while (!ado.EOS) {
					var ar = ado.ReadText(adReadLine).replace(/"/i, "").split("\t");
					db.Execute('INSERT INTO labels(path, label) VALUES ("' + ar[0] + '","' + ar[1] + '");');
					n++;
				}
				Addons.LabelSQLiteOdbc.MakeList();
			}
		} catch (e) {
			ShowError(e, [GetText("Load"), fn].join(": "));
		}
		ado.Close();
	},

	Save: function (fn)
	{
		try {
			var db = Addons.LabelSQLiteOdbc.GetDB();
			var ado = te.CreateObject("Adodb.Stream");
			ado.CharSet = "utf-8";
			ado.Open();
			var rs = db.Execute('SELECT path,label FROM labels');
			while (!rs.EOF) {
				ado.WriteText([rs.Fields(0).value.toString(), rs.Fields(1).value.toString()].join("\t") + "\r\n");
				rs.MoveNext();
			}
			ado.SaveToFile(fn, adSaveCreateOverWrite);
			ado.Close();
		} catch (e) {
			ShowError(e, [GetText("Save"), fn].join(": "));
		}
	},

	Finalize: function ()
	{
		te.Labels = null;
		Addons.LabelSQLiteOdbc.Close()
	}
};

if (window.Addon == 1) {
	AddEvent("Load", function ()
	{
		if (!Addons.Label || !Addons.Label.ENumCB) {
			return;
		}
		try {
			var bExists = fso.FileExists(Addons.LabelSQLiteOdbc.DBFILE);
			if (bExists) {
				Addons.LabelSQLiteOdbc.Open();
			} else {
				fso.CreateTextFile(Addons.LabelSQLiteOdbc.DBFILE).Close();
				Addons.LabelSQLiteOdbc.Open();
				try {
					Addons.LabelSQLiteOdbc.Load(Addons.Label.CONFIG);
				} catch (e) {}
			}
		} catch (e) {
			if (!bExists) {
				fso.DeleteFile(Addons.LabelSQLiteOdbc.DBFILE);
			}
			delete Addons.LabelSQLiteOdbc;
			return;
		}
		te.Labels = function (path)
		{
			var rs = Addons.LabelSQLiteOdbc.db.Execute('SELECT label FROM labels WHERE path="' + path + '"');
			return rs.EOF ? "" : rs.Fields(0).value.toString() || "";
		};

		Addons.Label.Initd = true;
		Addons.Label.Get = function (path)
		{
			return te.Labels(path) || "";
		};
		Addons.Label.ENumCB = function (fncb)
		{
			var rs = Addons.LabelSQLiteOdbc.db.Execute('SELECT path,label FROM labels');
			while (!rs.EOF) {
				fncb(rs.Fields(0).value.toString(), rs.Fields(1).value.toString());
				rs.MoveNext();
			}
		};

		Addons.Label.Set = function (path, s)
		{
			if (path) {
				var s1 = Addons.Label.Get(path);
				var ar = s1.split(/\s*;\s*/);
				s = s.replace(/[\\?\\*]|"/g, "");
				if (s) {
					if (s1) {
						Addons.LabelSQLiteOdbc.db.Execute('UPDATE labels SET label="' + s + '" WHERE path="' + path + '"');
					} else {
						Addons.LabelSQLiteOdbc.db.Execute('INSERT INTO labels(path, label) VALUES ("' + path + '","' + s + '");');
					}
				} else {
					Addons.LabelSQLiteOdbc.db.Execute('DELETE FROM labels WHERE path="' + path + '"');
				}
				var o = {};
				var bChanged = false;
				for (var j in ar) {
					o[ar[j]] = 1;
				}
				ar = (s || "").split(/\s*;\s*/);
				for (var j in ar) {
					o[ar[j]] ^= 1;
				}
				for (var j in o) {
					if (o[j]) {
						Addons.Label.Changed[j] = 1;
						Addons.Label.Redraw[fso.GetParentFolderName(path)] = true;
						bChanged = true;
					}
				}
				if (bChanged) {
					clearTimeout(Addons.Label.tid2);
					Addons.Label.tid2 = setTimeout(Addons.Label.Notify, 500);
					Addons.LabelSQLiteOdbc.MakeList();
				}
			}
		};

		Addons.Label.List = function (list)
		{
			var rs = Addons.LabelSQLiteOdbc.db.Execute('SELECT label FROM list');
			while (!rs.EOF) {
				var s = rs.Fields(0).value.toString();
				if (s) {
					list[s] = true;
				}
				rs.MoveNext();
			}
		};

		AddEvent("Finalize", Addons.LabelSQLiteOdbc.Finalize);
		AddEventId("AddonDisabledEx", "LabelSQLiteOdbc", Addons.LabelSQLiteOdbc.Finalize);
	}, true);
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
