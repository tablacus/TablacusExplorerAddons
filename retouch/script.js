var Addon_Id = "retouch";
var Default = "ToolBar2Left";

(function () {
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		if (!item.getAttribute("Set")) {
			item.setAttribute("MenuExec", 1);
			item.setAttribute("Menu", "Edit");
			item.setAttribute("MenuPos", -1);
			item.setAttribute("MenuName", "Retouch...");

			item.setAttribute("KeyOn", "List");

			item.setAttribute("MouseOn", "List");
		}
	}
	if (window.Addon == 1) {
		Addons.Retouch =
		{
			nPos: 0,
			strName: "Retouch...",

			Exec: function ()
			{
				var FV = te.Ctrl(CTRL_FV);
				if (FV) {
					var Selected = FV.SelectedItems();
					if (Selected.Count) {
						showModelessDialog("../addons/retouch/preview.html", window, "dialogWidth: 800px; dialogHeight: 600px; resizable: yes; status: 0");
					}
				}
			}
		};
		var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
		var s = GetAddonOption(Addon_Id, "Icon") || (h <= 16 ? "icon:shell32.dll,141,16" : "icon:shell32.dll,141,32");
		s = 'src="' + s.replace(/"/g, "") + '" style="width:' + h + 'px; height:' + h + 'px"';
		s = '<span class="button" id="RetouchButton" onclick="Addons.Retouch.Exec()" onmouseover="MouseOver(this)" onmouseout="MouseOut()" oncontextmenu="return false;"><img title="Retouch..." ' + s + '></span>';
		SetAddon(Addon_Id, Default, s);

		if (items.length) {
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.Retouch.strName = s;
			}
			//Menu
			if (item.getAttribute("MenuExec")) {
				Addons.Retouch.nPos = api.LowPart(item.getAttribute("MenuPos"));
				AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
				{
					api.InsertMenu(hMenu, Addons.Retouch.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.Retouch.strName));
					ExtraMenuCommand[nPos] = Addons.Retouch.Exec;
					return nPos;
				});
			}
			//Key
			if (item.getAttribute("KeyExec")) {
				SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), "Addons.Retouch.Exec();", "JScript");
			}
			//Mouse
			if (item.getAttribute("MouseExec")) {
				SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), "Addons.Retouch.Exec();", "JScript");
			}

			AddTypeEx("Add-ons", "Retouch", Addons.Retouch.Exec);
		}
	}
	else if (window.Addon == 2) {
		Addons = {};
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
						Addons.Retouch.Image = te.GdiplusBitmap();
						Addons.Retouch.Image.FromFile(Addons.Retouch.File);
						if (Addons.Retouch.File.match(/\.jpe?g/i)) {
							var hBM = Addons.Retouch.Image.GetHBITMAP(0);
							if (hBM) {
								Addons.Retouch.Image.FromHBITMAP(hBM, 0);
								api.DeleteObject(hBM);
							}
						}
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
				}
				else {
					var thum = Addons.Retouch.Image.GetThumbnailImage(document.F.width.value, document.F.height.value);
					thum.RotateFlip(document.F.rotation.value);
					img1.src = thum.DataURI(Addons.Retouch.File);
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
					commdlg.Filter = "All Files|*.*";
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
						thum.RotateFlip(document.F.rotation.value);

						var eps = api.Memory("EncoderParameters", 1);
						eps.Count = 1;
						ep = eps.Parameter(0);
						ep.Guid = EncoderQuality;
						ep.NumberOfValues = 1;
						ep.Type = EncoderParameterValueTypeLong;
						var pTrans = api.Memory("DWORD");
						pTrans.X = document.F.quality.value;
						ep.Value = pTrans.P;
						if (thum.Save(path, eps) == 0) {
							wsh.Popup(GetText("Completed.") + "\n" + path, 0, "Tablacus Explorer", MB_ICONINFORMATION);
							window.close();
						}
					}
				}, 100);}) ();
			}
		};
	}
})();
