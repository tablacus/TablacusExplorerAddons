Addons = {};

MainWindow.RunEvent1("BrowserCreated", document);

Addons.Retouch =
{
	Load: function ()
	{
		tid: null,

		ApplyLang(document);
		var FV = te.Ctrl(CTRL_FV);
		if (FV) {
			var Selected = FV.SelectedItems();
			if (Selected.Count) {
				Addons.Retouch.File = Selected.Item(0).Path;
				document.title = Addons.Retouch.File;
				Addons.Retouch.Image = te.WICBitmap();
				Addons.Retouch.Image.FromFile(Addons.Retouch.File);
				Addons.Retouch.Width = Addons.Retouch.Image.GetWidth();
				Addons.Retouch.Height = Addons.Retouch.Image.GetHeight();
				document.F.percent.value = 100;
				document.F.rotation.value = 0;
				Addons.Retouch.Change(document.F.percent);
			}
		}
	},

	Change: function (x)
	{
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
				document.F.width.value = Math.round(Addons.Retouch.Width * document.F.percent.value / 100);
				document.F.height.value = Math.round(Addons.Retouch.Height * document.F.percent.value / 100);
				break;
		}
		var img1 = document.getElementById("img1");
		if (api.LowPart(document.documentMode) < 10) {
			img1.src = Addons.Retouch.File;
			img1.style.width = document.F.width.value + "px";
			img1.style.height = document.F.height.value + "px";
			img1.style.filter = "progid:DXImageTransform.Microsoft.BasicImage(rotation=" + document.F.rotation.value + ");";
		} else {
			var thum = Addons.Retouch.Image.GetThumbnailImage(document.F.width.value, document.F.height.value);
			if (thum) {
				if (document.F.rotation.value != 0) {
					thum.RotateFlip(document.F.rotation.value);
				}
				img1.src = thum.DataURI(/\.jpe?g?$/.test(Addons.Retouch.File) ? "image/jpeg" : "image/png");
			}
		}
	},

	KeyDown: function (x)
	{
		clearTimeout(Addons.Retouch.tid);
		(function (x) { Addons.Retouch.tid = setTimeout(function () {
			Addons.Retouch.Change(x)
		}, 500);}) (x);
	},

	Rotate: function (x)
	{
		document.F.rotation.value = (api.LowPart(document.F.rotation.value) + (api.StrCmpI(x.name, "left") == 0 ? 3 : 1)) % 4;
		Addons.Retouch.Change(document.F.percent);
	},

	Save: function ()
	{
		(function () { setTimeout(function () {
			var commdlg = te.CommonDialog;
			commdlg.InitDir = fso.GetParentFolderName(Addons.Retouch.File);
			commdlg.Filter = (api.LoadString(hShell32, 9007) + (api.LoadString(hShell32, 9014).replace(/[^#]*#[^#]*#/, ""))).replace(/#/g, "|");
			commdlg.Flags = OFN_FILEMUSTEXIST | OFN_OVERWRITEPROMPT;
			if (commdlg.ShowSave()) {
				var path = commdlg.FileName;
				if (fso.GetExtensionName(path) == "") {
					path = fso.BuildPath(fso.GetParentFolderName(path), fso.GetBaseName(path) + "." + fso.GetExtensionName(Addons.Retouch.File));
				}
				var thum = Addons.Retouch.Image;
				if (document.F.width.value != thum.GetWidth() || document.F.height.value != thum.GetHeight()) {
					thum = thum.GetThumbnailImage(document.F.width.value, document.F.height.value);
				}
				if (document.F.rotation.value != 0) {
					thum.RotateFlip(document.F.rotation.value);
				}
				var hr = thum.Save(path, document.F.quality.value);
				if (hr == 0) {
					MessageBox(GetText("Completed.") + "\n" + path, null, MB_ICONINFORMATION);
				} else {
					MessageBox(api.sprintf(999, "Error: 0x%x\n%s", hr, path), null, MB_ICONSTOP);
				}
			}
		}, 99);}) ();
	}
};
