Addons = {};
RunEventUI("BrowserCreatedEx");

Addons.Retouch = {
	Load: async function () {
		ApplyLang(document);
		const FV = await te.Ctrl(CTRL_FV);
		if (FV) {
			const Selected = await FV.SelectedItems();
			if (await Selected.Count) {
				Addons.Retouch.File = await Selected.Item(0).Path;
				document.title = Addons.Retouch.File;
				Addons.Retouch.Image = await api.CreateObject("WICBitmap").FromFile(Addons.Retouch.File);
				if (await Addons.Retouch.Image) {
					Addons.Retouch.Width = await Addons.Retouch.Image.GetWidth();
					Addons.Retouch.Height = await Addons.Retouch.Image.GetHeight();
				}
				document.F.percent.value = 100;
				document.F.rotation.value = 0;
				Addons.Retouch.Change(document.F.percent);
			}
		}
		document.body.style.display = "";
	},

	Change: async function (x) {
		clearTimeout(Addons.Retouch.tid);
		switch (x.name) {
			case 'width':
				if (document.F.width.value == 0) {
					return;
				}
				document.F.height.value = Math.round(document.F.width.value * Addons.Retouch.Height / Addons.Retouch.Width);
				document.F.percent.value = document.F.width.value / Addons.Retouch.Width * 100;
				break;
			case 'height':
				if (document.F.height.value == 0) {
					return;
				}
				document.F.width.value = Math.round(document.F.height.value * Addons.Retouch.Width / Addons.Retouch.Height);
				document.F.percent.value = document.F.width.value / Addons.Retouch.Width * 100;
				break;
			case 'percent':
				if (document.F.percent.value == 0) {
					return;
				}
				document.F.width.value = Math.round(Addons.Retouch.Width * document.F.percent.value / 100) || "";
				document.F.height.value = Math.round(Addons.Retouch.Height * document.F.percent.value / 100) || "";
				break;
		}
		if (await Addons.Retouch.Image) {
			const img1 = document.getElementById("img1");
			if (ui_.IEVer < 10) {
				img1.src = Addons.Retouch.File;
				img1.style.width = document.F.width.value + "px";
				img1.style.height = document.F.height.value + "px";
				img1.style.filter = "progid:DXImageTransform.Microsoft.BasicImage(rotation=" + document.F.rotation.value + ");";
			} else {
				const thum = await Addons.Retouch.Image.GetThumbnailImage(document.F.width.value, document.F.height.value);
				if (thum) {
					if (document.F.rotation.value != 0) {
						await thum.RotateFlip(document.F.rotation.value);
					}
					img1.src = await thum.DataURI(/\.jpe?g?$/.test(Addons.Retouch.File) ? "image/jpeg" : "image/png");
				}
			}
			document.F.Save.disabled = false;
		} else {
			img1.src = null;
			document.F.Save.disabled = true;
		}
	},

	KeyDown: function (x) {
		clearTimeout(Addons.Retouch.tid);
		Addons.Retouch.tid = setTimeout(function (x) {
			Addons.Retouch.Change(x)
		}, 500, x);
	},

	Rotate: function (x) {
		debugger;
		document.F.rotation.value = (GetNum(document.F.rotation.value) + (SameText(x.name, "left") ? 3 : 1)) % 4;
		Addons.Retouch.Change(document.F.percent);
	},

	Save: function () {
		setTimeout(async function () {
			const commdlg = await api.CreateObject("CommonDialog");
			commdlg.InitDir = GetParentFolderName(Addons.Retouch.File);
			commdlg.Filter = (await api.LoadString(hShell32, 9007) + ((await api.LoadString(hShell32, 9014)).replace(/[^#]*#[^#]*#/, ""))).replace(/#/g, "|");
			commdlg.Flags = OFN_FILEMUSTEXIST | OFN_OVERWRITEPROMPT;
			if (await commdlg.ShowSave()) {
				let path = await commdlg.FileName;
				if (await fso.GetExtensionName(path) == "") {
					path = BuildPath(GetParentFolderName(path), await fso.GetBaseName(path) + "." + await fso.GetExtensionName(Addons.Retouch.File));
				}
				let thum = await Addons.Retouch.Image;
				if (document.F.width.value != await thum.GetWidth() || document.F.height.value != await thum.GetHeight()) {
					thum = await thum.GetThumbnailImage(document.F.width.value, document.F.height.value);
				}
				if (document.F.rotation.value != 0) {
					await thum.RotateFlip(document.F.rotation.value);
				}
				const hr = await thum.Save(path, document.F.quality.value);
				if (hr == 0) {
					MessageBox(await GetText("Completed.") + "\n" + path, null, MB_ICONINFORMATION);
				} else {
					MessageBox(await api.sprintf(999, "Error: 0x%x\n%s", hr, path), null, MB_ICONSTOP);
				}
			}
		}, 99);
	}
};
