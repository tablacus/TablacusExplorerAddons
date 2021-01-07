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
			let image = Sync.BGImage.db[hwnd];
			if ("object" === typeof image) {
				Sync.BGImage.ShowImage(hwnd);
				return;
			}
			if (image === 1) {
				return;
			}
			Sync.BGImage.db[hwnd] = 1;
			const path = Ctrl.FolderItem.Path;
			const list = Sync.BGImage.List;
			for (let i = list.length; i--;) {
				if (PathMatchEx(path, list[i][0])) {
					image = list[i][1];
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
								o.listx[1] = undefined;
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

try {
	const ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\bgimage.tsv"));
	while (!ado.EOS) {
		const ar = ExtractMacro(te, ado.ReadText(adReadLine)).split("\t");
		if (ar[0]) {
			ar[1] = api.PathUnquoteSpaces(ar[1]);
			Sync.BGImage.List.push(ar);
		}
	}
	ado.Close();
} catch (e) { }

const cFV = te.Ctrls(CTRL_FV);
for (let i in cFV) {
	if (cFV[i].hwndList) {
		Sync.BGImage.Arrange(cFV[i]);
	}
}
