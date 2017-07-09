Addons.ExtensionIcon = {
	Icon: {},
	FV: {},

	GetIconImage: function (fn)
	{
		var image;
		fn = api.PathUnquoteSpaces(ExtractMacro(te, fn));
		if (/\.ico$|\*/.test(fn)) {
			var sfi = api.Memory("SHFILEINFO");
			api.SHGetFileInfo(fn, 0, sfi, sfi.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_USEFILEATTRIBUTES);
			image = te.WICBitmap().FromHICON(sfi.hIcon);
			api.DestroyIcon(sfi.hIcon);
		} else {
			image = te.WICBitmap().FromFile(fn);
		}
		if (image) {
			var w = image.GetWidth(), h = image.GetHeight(), x = api.GetSystemMetrics(SM_CXSMICON), y = api.GetSystemMetrics(SM_CYSMICON);
			if (w && h && (w != x || h != y)) {
				image = image.GetThumbnailImage(x, y);
			}
		}
		return image;
	}
};

if (window.Addon == 1) {
	try {
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\extensionicon.tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[0]) {
				var a2 = ar[0].toLowerCase().split(/[^\w_!~#$%&\(\)]/);
				for (var i in a2) {
					if (a2[i]) {
						Addons.ExtensionIcon.Icon[a2[i]] = Addons.ExtensionIcon.GetIconImage(ar[1]);
					}
				}
			}
		}
		ado.Close();
	} catch (e) {}

	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes)
	{
		if (Ctrl.Type == CTRL_SB && Ctrl.CurrentViewMode >= FVM_SMALLICON && Ctrl.CurrentViewMode <= FVM_DETAILS) {
			var image =  Addons.ExtensionIcon.Icon[fso.GetExtensionName(api.GetDisplayNameOf(pid, SHGDN_FORPARSING)).toLowerCase()];
			if (image) {
				(function (hList, image, dwItemSpec, fFlags) { setTimeout(function () {
					var rc = api.Memory("RECT");
					rc.Left = LVIR_ICON;
					api.SendMessage(hList, LVM_GETITEMRECT, dwItemSpec, rc);
					if (rc.Bottom - rc.Top <= api.GetSystemMetrics(SM_CYSMICON) * 2) {
						var hIcon, hBM;
						var size = api.Memory("SIZE");
						var hdc = api.GetWindowDC(hList);
						if (hdc) {
							if (!(fFlags & FWF_NOCLIENTEDGE)) {
								rc.Left += 2;
								rc.Top += 2;
								rc.Right += 2;
								rc.Bottom += 2;
							}
							var w = image.GetWidth(), h = image.GetHeight();
							var hbm = image.GetHBITMAP(GetSysColor(COLOR_WINDOW));
							if (hbm) {
								var hmdc = api.CreateCompatibleDC(hdc);
								var hOld = api.SelectObject(hmdc, hbm);
								api.FillRect(hdc, rc, api.CreateSolidBrush(GetSysColor(COLOR_WINDOW)));
								api.BitBlt(hdc, rc.Right - w, rc.Top + (rc.Bottom - rc.Top - h) / 2, w, h, hmdc, 0, 0, SRCCOPY);
								api.SelectObject(hmdc, hOld);
								api.DeleteDC(hmdc);
								api.DeleteObject(hbm);
							}
							api.ReleaseDC(hList, hdc);
						}
					}
				}, 99);}) (Ctrl.hwndList, image, nmcd.dwItemSpec, Ctrl.FolderFlags);
			}
		}
	}, true);
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
