const Addon_Id = "bgimage";
const item = GetAddonElement(Addon_Id);

Sync.BGImage = {
	tid: {},
	List: [],
	db: {},

	Arrange: function (Ctrl, nDog) {
		delete Sync.BGImage.tid[Ctrl.Id];
		const hwnd = Ctrl.hwndList;
		if (hwnd && Ctrl.FolderItem) {
			const path = Ctrl.FolderItem.Path;
			let db = Sync.BGImage.db[path];
			if (db) {
				db[hwnd] = 1;
				if (db.image) {
					Sync.BGImage.ShowImage(db);
				}
				return;
			}
			db = {};
			db[hwnd] = 1;
			Sync.BGImage.db[path] = db;
			const list = Sync.BGImage.List;
			for (let i = list.length; i--;) {
				if (PathMatchEx(path, list[i][0])) {
					const image = list[i][1];
					if ("object" === typeof image) {
						db.image = image;
						Sync.BGImage.ShowImage(db);
						break;
					}
					if ("string" === typeof image) {
						Threads.GetImage({
							path: image,
							db: db,
							listx: list[i],

							onload: function (o) {
								if ("object" !== typeof o.listx[1]) {
									o.listx[1] = o.out;
								}
								o.db.image = o.listx[1];
								Sync.BGImage.ShowImage(o.db);
							},

							onerror: function (o) {
								o.listx[1] = void 0;
							}
						});
					}
					break;
				}
			}
		} else {
			Sync.BGImage.Retry(Ctrl, nDog);
		}
	},

	ShowImage: function (db) {
		for (hwnd in db) {
			if (hwnd !== "image") {
				delete db[hwnd];
				Sync.BGImage.SetImage(hwnd, LVBKIF_TYPE_WATERMARK | LVBKIF_FLAG_ALPHABLEND, db.image.GetHBITMAP(-2));
			}
		}
	},

	Arrange2: function (Ctrl) {
		if (Ctrl) {
			if (Ctrl.Type == CTRL_TE) {
				Ctrl = te.Ctrl(CTRL_FV);
				if (!Ctrl) {
					return;
				}
			}
			if (Ctrl.Type == CTRL_SB) {
				Sync.BGImage.Arrange(Ctrl);
				if (!Sync.BGImage.tid[Ctrl.Id]) {
					Sync.BGImage.tid[Ctrl.Id] = setTimeout(function () {
						Sync.BGImage.Arrange(Ctrl);
					}, 99);
				}
			}
		}
	},

	Retry: function (Ctrl, nDog) {
		nDog = (nDog || 0) + 1;
		if (nDog < 9) {
			Sync.BGImage.tid[Ctrl.Id] = setTimeout(function () {
				Sync.BGImage.Arrange(Ctrl, nDog);
			}, nDog * 100);
		}
	},

	SetImage: function (hwnd, ulFlags, hbm) {
		Sync.BGImage.ClearImage(hwnd);
		const lvbk = api.Memory("LVBKIMAGE");
		lvbk.ulFlags = ulFlags;
		lvbk.hbm = hbm;
		if (!api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk)) {
			if (hbm) {
				api.DeleteObject(hbm);
			}
		}
	},

	ClearImage: function (hwnd) {
		const lvbk = api.Memory("LVBKIMAGE");
		lvbk.ulFlags = LVBKIF_TYPE_WATERMARK;
		if (api.SendMessage(hwnd, LVM_GETBKIMAGE, 0, lvbk)) {
			if (lvbk.hbm) {
				api.DeleteObject(lvbk.hbm);
			}
		}
	},

	Unload: function (Ctrl, fs, wFlags, Prev) {
		const hwnd = Ctrl.hwndList;
		if (hwnd) {
			Sync.BGImage.ClearImage(hwnd);
		}
	},

	Clear: function () {
		for (let hwnd in Sync.BGImage.db) {
			delete Sync.BGImage.db[hwnd];
			Sync.BGImage.SetImage(hwnd, LVBKIF_TYPE_WATERMARK, null);
		}
	}
}

AddEvent("ListViewCreated", Sync.BGImage.Arrange);

AddEvent("BeforeNavigate", Sync.BGImage.Unload, true);

AddEventId("AddonDisabledEx", "bgimage", Sync.BGImage.Clear);

AddEvent("Finalize", Sync.BGImage.Clear);

const ar = (ReadTextFile(BuildPath(te.Data.DataFolder, "config\\bgimage.tsv"))).split("\n");
for (let i = 0; i < ar.length; ++i) {
	const db = ar[i].replace(/^\s|\s$/g, "").split(/\t/);
	if (db.length > 1) {
		db[1] = PathUnquoteSpaces(db[1]);
		Sync.BGImage.List.push(db);
	}
}

const cFV = te.Ctrls(CTRL_FV);
for (let i in cFV) {
	if (cFV[i].hwndList) {
		Sync.BGImage.Arrange(cFV[i]);
	}
}
