Sync.LabelSQLiteOdbc = {
	db: api.CreateObject("ADODB.Connection"),
	DBFILE: BuildPath(te.Data.DataFolder, "config\\label.db"),

	MakeList: function () {
		const db = Sync.LabelSQLiteOdbc.GetDB();
		const list = [];
		const rs = db.Execute('SELECT label FROM labels');
		let ix = [];
		while (!rs.EOF) {
			let s = rs.Fields(0).value.toString() || "";
			const ar = s.split(/\s*;\s*/);
			for (let i in ar) {
				s = ar[i];
				if (s) {
					ix.push(s);
				}
			}
			rs.MoveNext();
		}
		ix = ix.sort(function (a, b) {
			return api.StrCmpLogical(b, a)
		});
		for (let i = ix.length; i--;) {
			list[ix[i]] = true;
		}
		db.Execute("CREATE TABLE IF NOT EXISTS list (label TEXT);");
		db.Execute('DELETE FROM list');
		for (let i in list) {
			db.Execute('INSERT INTO list(label) VALUES ("' + i + '");');
		}
	},

	Open: function () {
		Sync.LabelSQLiteOdbc.db.Open("DRIVER=SQLite3 ODBC Driver;Database=" + Sync.LabelSQLiteOdbc.DBFILE);
		Sync.LabelSQLiteOdbc.db.Execute("CREATE TABLE IF NOT EXISTS labels (path TEXT, label TEXT);");
		Sync.LabelSQLiteOdbc.Open = function () { };
		AddEvent("Finalize", Sync.LabelSQLiteOdbc.Close);
	},

	Close: function () {
		if (Sync.LabelSQLiteOdbc.db) {
			Sync.LabelSQLiteOdbc.db.Close();
			delete Sync.LabelSQLiteOdbc.db;
		}
	},

	GetDB: function () {
		if (MainWindow.Sync.LabelSQLiteOdbc) {
			return MainWindow.Sync.LabelSQLiteOdbc.db;
		}
		Sync.LabelSQLiteOdbc.Open();
		return Sync.LabelSQLiteOdbc.db;
	},

	Load: function (fn, DB) {
		try {
			LoadDBFromTSV(DB || Sync.Label.DB, fn || Sync.Label.CONFIG);
			Sync.LabelSQLiteOdbc.MakeList();
		} catch (e) {
			ShowError(e, [GetText("Load"), fn].join(": "));
		}
	},

	Save: function (fn) {
		try {
			SaveDBToTSV(Sync.Label.DB, fn);
		} catch (e) {
			ShowError(e, [GetText("Save"), fn].join(": "));
		}
	},

	Finalize: function () {
		te.Labels = null;
		Sync.LabelSQLiteOdbc.Close()
	}
};

AddEvent("Load", function (fn) {
	if (!Sync.Label) {
		return;
	}
	const DB = {
		Get: function (path) {
			if (Sync.LabelSQLiteOdbc.db) {
				const rs = Sync.LabelSQLiteOdbc.db.Execute('SELECT label FROM labels WHERE path="' + path + '"');
				return rs.EOF ? "" : rs.Fields(0).value.toString() || "";
			}
			return "";
		},

		ENumCB: function (fncb) {
			const rs = Sync.LabelSQLiteOdbc.db.Execute('SELECT path,label FROM labels');
			while (!rs.EOF) {
				fncb(rs.Fields(0).value.toString(), rs.Fields(1).value.toString());
				rs.MoveNext();
			}
		},

		Set: function (path, s) {
			if (path) {
				const s1 = Sync.Label.DB.Get(path);
				s = s.replace(/[\\?\\*]|"/g, "");
				if (s != s1) {
					if (s) {
						if (s1) {
							Sync.LabelSQLiteOdbc.db.Execute('UPDATE labels SET label="' + s + '" WHERE path="' + path + '"');
						} else {
							Sync.LabelSQLiteOdbc.db.Execute('INSERT INTO labels(path, label) VALUES ("' + path + '","' + s + '");');
						}
					} else {
						Sync.LabelSQLiteOdbc.db.Execute('DELETE FROM labels WHERE path="' + path + '"');
					}
					const fn = api.ObjGetI(this, "OnChange");;
					fn && fn(path, s, s1);
				}
			}
		},

		Clear: function () {
			Sync.LabelSQLiteOdbc.db.Execute('DELETE FROM labels');
			Sync.LabelSQLiteOdbc.db.Execute("CREATE TABLE IF NOT EXISTS list (label TEXT);");
			Sync.LabelSQLiteOdbc.db.Execute('DELETE FROM list');
			return this;
		},

		Load: function () {
			return this;
		},

		Save: function () { },
		Close: function () { }
	}

	try {
		const bExists = fso.FileExists(Sync.LabelSQLiteOdbc.DBFILE);
		if (bExists) {
			Sync.LabelSQLiteOdbc.Open();
		} else {
			fso.CreateTextFile(Sync.LabelSQLiteOdbc.DBFILE).Close();
			Sync.LabelSQLiteOdbc.Open();
			Sync.LabelSQLiteOdbc.Load(Sync.Label.CONFIG, DB);
		}
	} catch (e) {
		if (!bExists) {
			fso.DeleteFile(Sync.LabelSQLiteOdbc.DBFILE);
		}
		delete Sync.LabelSQLiteOdbc;
		return;
	}
	Sync.Label.DB = DB;
	Sync.Label.DB.DB = DB.Get;
	AddEvent("Finalize", Sync.LabelSQLiteOdbc.Finalize);
	AddEventId("AddonDisabledEx", "LabelSQLiteOdbc", Sync.LabelSQLiteOdbc.Finalize);
}, true);
