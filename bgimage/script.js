var Addon_Id = "bgimage";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.BGImage =
	{
		tid: {},
		List: [],
		db: {},

		Arrange: function (Ctrl, nDog) {
			delete Addons.BGImage.tid[Ctrl.Id];
			var hwnd = Ctrl.hwndList;
			if (hwnd) {
				var image = Addons.BGImage.db[hwnd];
				if ("object" === typeof image) {
					Addons.BGImage.ShowImage(hwnd);
					return;
				}
				if (image === 1) {
					return;
				}
				Addons.BGImage.db[hwnd] = 1;
				var path = Ctrl.FolderItem.Path;
				var list = Addons.BGImage.List;
				for (var i = list.length; i--;) {
					if (PathMatchEx(path, list[i][0])) {
						var image = list[i][1];
						if ("object" === typeof image) {
							Addons.BGImage.ShowImage(hwnd, image);
						} else if ("string" === typeof image) {
							Threads.GetImage({
								hwnd: hwnd,
								path: image,
								listx: list[i],

								onload: function (o) {
									if ("object" !== typeof o.listx[1]) {
										o.listx[1] = api.CreateObject("WICBitmap").FromSource(o.out);
									}
									Addons.BGImage.ShowImage(hwnd, o.listx[1]);
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
				Addons.BGImage.Retry(Ctrl, nDog);
			}
		},

		ShowImage: function (hwnd, image) {
			Addons.BGImage.db[hwnd] = image;
			var lvbk = api.Memory("LVBKIMAGE");
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
					Addons.BGImage.Arrange(Ctrl);
					if (!Addons.BGImage.tid[Ctrl.Id]) {
						Addons.BGImage.tid[Ctrl.Id] = setTimeout(function () {
							Addons.BGImage.Arrange(Ctrl);
						}, 99);
					}
				}
			}
		},

		Retry: function (Ctrl, nDog) {
			nDog = (nDog || 0) + 1;
			if (nDog < 9) {
				Addons.BGImage.tid[Ctrl.Id] = setTimeout(function () {
					Addons.BGImage.Arrange(Ctrl, nDog);
				}, nDog * 100);
			}
		},

		Clear: function () {
			var lvbk = api.Memory("LVBKIMAGE");
			lvbk.ulFlags = LVBKIF_TYPE_WATERMARK;
			for (var hwnd in Addons.BGImage.db) {
				delete Addons.BGImage.db[hwnd];
				api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk);
			}
		}
	}

	AddEvent("ListViewCreated", Addons.BGImage.Arrange);

	AddEventId("AddonDisabledEx", "bgimage", Addons.BGImage.Clear);

	AddEvent("Finalize", Addons.BGImage.Clear);

	try {
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\bgimage.tsv"));
		while (!ado.EOS) {
			var ar = ExtractMacro(te, ado.ReadText(adReadLine)).split("\t");
			if (ar[0]) {
				ar[1] = api.PathUnquoteSpaces(ar[1]);
				Addons.BGImage.List.push(ar);
			}
		}
		ado.Close();
	} catch (e) { }

	var cFV = te.Ctrls(CTRL_FV);
	for (var i in cFV) {
		var hwnd = cFV[i].hwndList;
		if (hwnd) {
			Addons.BGImage.Arrange(cFV[i]);
		}
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
