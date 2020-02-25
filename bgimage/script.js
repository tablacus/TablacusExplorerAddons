var Addon_Id = "bgimage";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.BGImage =
	{
		tid: {},
		List: [],

		Arrange: function (Ctrl, nDog) {
			delete Addons.BGImage.tid[Ctrl.Id];
			var hwnd = Ctrl.hwndList;
			if (hwnd) {
				var lvbk = api.Memory("LVBKIMAGE");
				var path = Ctrl.FolderItem.Path;
				var list = Addons.BGImage.List;
				for (var i = list.length; i--;) {
					if (PathMatchEx(path, list[i][0])) {
						var image = list[i][1];
						if (/string/i.test(typeof image)) {
							list[i][1] = undefined;
							Threads.GetImage({
								Ctrl: Ctrl,
								path: image,
								listx: list[i],

								onload: function (o) {
									o.listx[1] = api.CreateObject("WICBitmap").FromSource(o.out);
									Addons.BGImage.Arrange(o.Ctrl);
								}
							});
						}
						if (/object/i.test(typeof image)) {
							lvbk.hbm = image.GetHBITMAP(-2);
						}
						break;
					}
				}
				lvbk.ulFlags = LVBKIF_TYPE_WATERMARK | LVBKIF_FLAG_ALPHABLEND;
				api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk);
			} else {
				Addons.BGImage.Retry(Ctrl, nDog);
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

		Finalize: function () {
			var cFV = te.Ctrls(CTRL_FV);
			var lvbk = api.Memory("LVBKIMAGE");
			lvbk.ulFlags = LVBKIF_TYPE_WATERMARK;
			for (var i in cFV) {
				var hwnd = cFV[i].hwndList;
				if (hwnd) {
					api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk);
				}
			}
		}
	}

	AddEvent("ListViewCreated", Addons.BGImage.Arrange);

	AddEventId("AddonDisabledEx", "bgimage", Addons.BGImage.Finalize);

	AddEvent("Finalize", Addons.BGImage.Finalize);

	try {
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\bgimage.tsv"));
		while (!ado.EOS) {
			var ar = ExtractMacro(te, ado.ReadText(adReadLine)).split("\t");
			if (ar[0]) {
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
