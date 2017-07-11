Addons.ExtensionIcon = {
	Icon: { 0: {}, 1: {}},

	GetIconImage: function (fn, Large)
	{
		var image;
		fn = api.PathUnquoteSpaces(ExtractMacro(te, fn));
		if (/\.ico$|\*/.test(fn)) {
			var sfi = api.Memory("SHFILEINFO");
			if (Large) {
				api.SHGetFileInfo(fn, 0, sfi, sfi.Size, SHGFI_SYSICONINDEX | SHGFI_USEFILEATTRIBUTES);
				sfi.hIcon = api.ImageList_GetIcon(te.Data.SHIL[SHIL_EXTRALARGE], sfi.iIcon, ILD_NORMAL);
			} else {
				api.SHGetFileInfo(fn, 0, sfi, sfi.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_USEFILEATTRIBUTES);
			}
			image = te.WICBitmap().FromHICON(sfi.hIcon);
			api.DestroyIcon(sfi.hIcon);
		} else {
			image = te.WICBitmap().FromFile(fn);
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
						Addons.ExtensionIcon.Icon[0][a2[i]] = Addons.ExtensionIcon.GetIconImage(ar[1], 0);
						Addons.ExtensionIcon.Icon[1][a2[i]] = Addons.ExtensionIcon.GetIconImage(ar[2], 1);
					}
				}
			}
		}
		ado.Close();
	} catch (e) {}

	AddEvent("HandleIcon", function (Ctrl, pid)
	{
		if (Ctrl.Type == CTRL_SB) {
			if (Addons.ExtensionIcon.Icon[Ctrl.IconSize < 32 ? 0 : 1][fso.GetExtensionName(api.GetDisplayNameOf(pid, SHGDN_FORPARSING)).toLowerCase()]) {
				return true;
			}
		}
	});

	AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd)
	{
		if (Ctrl.Type == CTRL_SB) {
			var image =  Addons.ExtensionIcon.Icon[Ctrl.IconSize < 32 ? 0 : 1][fso.GetExtensionName(api.GetDisplayNameOf(pid, SHGDN_FORPARSING)).toLowerCase()];
			if (image) {
				var rc = api.Memory("RECT");
				rc.Left = LVIR_ICON;
				api.SendMessage(Ctrl.hwndList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
				var hbm = image.GetHBITMAP(GetSysColor(COLOR_WINDOW));
				if (hbm) {
					var hmdc = api.CreateCompatibleDC(nmcd.hdc);
					var hOld = api.SelectObject(hmdc, hbm);
					var w = Ctrl.IconSize * screen.logicalYDPI / 96, h = w;
					var w0 = image.GetWidth(), h0 = image.GetHeight();
					if (w0 > h0) {
						h *= h0 / w0;
					} else if (w0 < h0) {
						w *= w0 / h0;
					}
					if (w > w0 && h > h0) {
						w = w0;
						h = h0;
					}
					api.TransparentBlt(nmcd.hdc, rc.Left + (rc.Right - rc.Left - w) / 2, rc.Top + (rc.Bottom - rc.Top - h) / 2, w, h, hmdc, 0, 0, w0, h0, GetSysColor(COLOR_WINDOW));
					api.SelectObject(hmdc, hOld);
					api.DeleteDC(hmdc);
					api.DeleteObject(hbm);
				}
			}
		}
	});
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
