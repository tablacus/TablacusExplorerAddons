const Addon_Id = "bgimage";
const item = GetAddonElement(Addon_Id);

Sync.BGImage = {
	tid: {},
	List: [],
	db: {},

	Arrange: function (Ctrl, nDog) {
		delete Sync.BGImage.tid[Ctrl.Id];
		const hwnd = Ctrl.hwndList;
		if (hwnd) {
			const r = Sync.BGImage.db[hwnd];
			if ("object" === typeof r) {
				Sync.BGImage.ShowImage(hwnd);
				return;
			}
			if (r === 1) {
				return;
			}
			Sync.BGImage.db[hwnd] = 1;
			const path = Ctrl.FolderItem.Path;
			const list = Sync.BGImage.List;
			for (let i = list.length; i--;) {
				if (PathMatchEx(path, list[i][0])) {
					const image = list[i][1];
					if ("object" === typeof image) {
						Sync.BGImage.ShowImage(hwnd, image);
					} else if ("string" === typeof image) {
						Threads.GetImage({
							hwnd: hwnd,
							path: image,
							listx: list[i],

							onload: function (o) {
								if ("object" !== typeof o.listx[1]) {
									o.listx[1] = o.out;
								}
								Sync.BGImage.ShowImage(hwnd, o.listx[1]);
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

	ShowImage: function (hwnd, image) {
		Sync.BGImage.db[hwnd] = image;
		const lvbk = api.Memory("LVBKIMAGE");
		lvbk.ulFlags = LVBKIF_TYPE_WATERMARK | LVBKIF_FLAG_ALPHABLEND;
		lvbk.hbm = image.GetHBITMAP(-2);
		if (!api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk)) {
			api.DeleteObject(lvbk.hbm);
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

	Clear: function () {
		const lvbk = api.Memory("LVBKIMAGE");
		lvbk.ulFlags = LVBKIF_TYPE_WATERMARK;
		for (let hwnd in Sync.BGImage.db) {
			delete Sync.BGImage.db[hwnd];
			api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk);
		}
	}
}

AddEvent("ListViewCreated", Sync.BGImage.Arrange);

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
