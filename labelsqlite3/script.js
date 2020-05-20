var Addon_Id = "labelsqlite3";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuPos", -1);
}

Addons.LabelSQLite3 =
{
	DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\labelsqlite3\\tsqlite", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{CAC858A3-6D0C-4E03-A609-880C7F04BBDA}"),

	DBFILE: fso.BuildPath(te.Data.DataFolder, "config\\label3.db"),

	MakeList: function () {
		var db = Addons.LabelSQLite3.GetDB();
		var list = [], ix = [];
		db.sqlite3_exec('SELECT label FROM labels', function (rs) {
			var ar = (rs["label"] || "").split(/\s*;\s*/);
			for (var i in ar) {
				var s = ar[i];
				if (s) {
					ix.push(s);
				}
			}
		}, api.CreateObject);
		ix = ix.sort(function (a, b) {
			return api.StrCmpLogical(b, a)
		});
		for (var i = ix.length; i--;) {
			list[ix[i]] = true;
		}
		db.sqlite3_exec("CREATE TABLE IF NOT EXISTS list (label TEXT PRIMARY KEY);");
		db.sqlite3_exec('DELETE FROM list');
		for (var i in list) {
			db.sqlite3_exec('INSERT INTO list(label) VALUES ("' + i + '");');
		}
	},

	Open: function () {
		Addons.LabelSQLite3.db = Addons.LabelSQLite3.DLL.Open(api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("Path" + (api.sizeof("HANDLE") * 8)) || 'winsqlite3.dll')));
		if (Addons.LabelSQLite3.db && Addons.LabelSQLite3.db.sqlite3_open && Addons.LabelSQLite3.db.sqlite3_open(Addons.LabelSQLite3.DBFILE) == 0) {
			Addons.LabelSQLite3.db.sqlite3_exec("CREATE TABLE IF NOT EXISTS labels (path TEXT PRIMARY KEY, label TEXT);");
			Addons.LabelSQLite3.Open = function () { };
			AddEvent("Finalize", Addons.LabelSQLite3.Close);
			return;
		}
		Addons.LabelSQLite3.Close();
	},

	Close: function () {
		if (Addons.LabelSQLite3.db) {
			Addons.LabelSQLite3.db.sqlite3_close();
			Addons.LabelSQLite3.db = {
				sqlite3_exec: function () { return 1 },
				sqlite3_close: function () { }
			};
		}
	},

	GetDB: function () {
		if (MainWindow.Addons.LabelSQLite3.db) {
			return MainWindow.Addons.LabelSQLite3.db;
		}
		Addons.LabelSQLite3.Open();
		return Addons.LabelSQLite3.db;
	},

	Load: function (fn) {
		try {
			var db = Addons.LabelSQLite3.GetDB();
			var ado = api.CreateObject("ads");
			ado.CharSet = "utf-8";
			ado.Open();
			ado.LoadFromFile(fn);
			if (!ado.EOS) {
				db.sqlite3_exec('BEGIN');
				db.sqlite3_exec('DELETE FROM labels');
				var n = 0;
				while (!ado.EOS) {
					var ar = ado.ReadText(adReadLine).replace(/"/i, "").split("\t");
					db.sqlite3_exec("INSERT INTO labels(path, label) VALUES ('" + ar[0].replace(/'/g, "''") + "','" + ar[1].replace(/'/g, "''") + "');");
					n++;
				}
				db.sqlite3_exec('COMMIT');
				Addons.LabelSQLite3.MakeList();
			}
		} catch (e) {
			ShowError(e, [GetText("Load"), fn].join(": "));
		}
		ado.Close();
	},

	Save: function (fn) {
		try {
			var db = Addons.LabelSQLite3.GetDB();
			var ado = api.CreateObject("ads");
			ado.CharSet = "utf-8";
			ado.Open();
			db.sqlite3_exec('BEGIN');
			db.sqlite3_exec('SELECT path,label FROM labels', function (rs) {
				ado.WriteText([rs["path"], rs["label"]].join("\t") + "\r\n");
			}, api.CreateObject);
			db.sqlite3_exec('COMMIT');
			ado.SaveToFile(fn, adSaveCreateOverWrite);
			ado.Close();
		} catch (e) {
			ShowError(e, [GetText("Save"), fn].join(": "));
		}
	},

	Finalize: function () {
		te.Labels = null;
		Addons.LabelSQLite3.Close()
	}
};

if (window.Addon == 1) {
	AddEvent("Load", function () {
		if (!Addons.Label || !Addons.Label.ENumCB) {
			return;
		}
		try {
			var bExists = fso.FileExists(Addons.LabelSQLite3.DBFILE);
			if (bExists) {
				Addons.LabelSQLite3.Open();
			} else {
				fso.CreateTextFile(Addons.LabelSQLite3.DBFILE).Close();
				Addons.LabelSQLite3.Open();
				try {
					Addons.LabelSQLite3.Load(Addons.Label.CONFIG);
				} catch (e) { }
			}
		} catch (e) {
			if (!bExists) {
				fso.DeleteFile(Addons.LabelSQLite3.DBFILE);
			}
			delete Addons.LabelSQLite3;
			return;
		}
		if (Addons.LabelSQLite3.db && Addons.LabelSQLite3.db.sqlite3_exec) {
			te.Labels = function (path) {
				return Addons.LabelSQLite3.db.sqlite3_exec('SELECT label FROM labels WHERE path="' + path + '"', 1);
			};

			Addons.Label.Initd = true;
			Addons.Label.Get = function (path) {
				return te.Labels(path) || "";
			};

			Addons.Label.ENumCB = function (fncb) {
				Addons.LabelSQLite3.db.sqlite3_exec('SELECT path,label FROM labels', function (rs) {
					fncb(rs["path"], rs["label"]);
				}, api.CreateObject);
			};

			Addons.Label.Set = function (path, s) {
				if (path) {
					var s1 = Addons.Label.Get(path);
					var ar = s1.split(/\s*;\s*/);
					s = s.replace(/\\?|\\*|"/g, "");
					if (s) {
						if (s1) {
							Addons.LabelSQLite3.db.sqlite3_exec("UPDATE labels SET label='" + s.replace(/'/, "''") + "' WHERE path='" + path.replace(/'/, "''") + "'");
						} else {
							Addons.LabelSQLite3.db.sqlite3_exec("INSERT INTO labels(path, label) VALUES ('" + path.replace(/'/, "''") + "','" + s.replace(/'/, "''") + "');");
						}
					} else {
						Addons.LabelSQLite3.db.sqlite3_exec("DELETE FROM labels WHERE path='" + path.replace(/'/, "''") + "'");
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
						Addons.LabelSQLite3.MakeList();
					}
				}
			};

			Addons.Label.List = function (list) {
				Addons.LabelSQLite3.db.sqlite3_exec('SELECT label FROM list', function (rs) {
					var s = rs["label"];
					if (s) {
						list[s] = true;
					}
				}, api.CreateObject);
			};

			AddEvent("Finalize", Addons.LabelSQLite3.Finalize);
			AddEventId("AddonDisabledEx", "LabelSQLite3", Addons.LabelSQLite3.Finalize);
		}
	}, true);
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
