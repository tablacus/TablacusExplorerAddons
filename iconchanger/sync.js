AddEvent("Load", function () {
	const ar = [];
	try {
		const ado = OpenAdodbFromTextFile(BuildPath(te.Data.DataFolder, "config\\iconchanger.tsv"));
		while (!ado.EOS) {
			ar.push(ado.ReadText(adReadLine));
		}
		ado.Close();
	} catch (e) { }
	if (ar.length) {
		const size = api.Memory("SIZE");
		const sfi = api.Memory("SHFILEINFO");
		api.SHGetFileInfo("*", 0, sfi, sfi.Size, SHGFI_SYSICONINDEX | SHGFI_USEFILEATTRIBUTES);
		const iUndef = sfi.iIcon;

		for (let i = ar.length; i--;) {
			let image = api.CreateObject("WICBitmap");
			const a = ar[i].split(/\t/);
			const type = a.shift();
			const typelc = String(type).toLowerCase();
			let iIcon = -1;
			if (typelc == "folder closed") {
				api.SHGetFileInfo("*", FILE_ATTRIBUTE_DIRECTORY, sfi, sfi.Size, SHGFI_SYSICONINDEX | SHGFI_USEFILEATTRIBUTES);
				iIcon = sfi.iIcon;
			} else if (typelc == "folder opened") {
				api.SHGetFileInfo("*", FILE_ATTRIBUTE_DIRECTORY, sfi, sfi.Size, SHGFI_SYSICONINDEX | SHGFI_OPENICON | SHGFI_USEFILEATTRIBUTES);
				iIcon = sfi.iIcon;
			} else if (typelc == "undefined") {
				iIcon = iUndef;
			} else if (typelc == "share") {
				iIcon = api.ImageList_GetOverlayImage(te.Data.SHIL[0], 1);
			} else if (typelc == "shortcut") {
				iIcon = api.ImageList_GetOverlayImage(te.Data.SHIL[0], 2);
			} else if (/\*/.test(typelc)) {
				if (api.SHGetFileInfo(ExtractMacro(te, type), 0, sfi, sfi.Size, SHGFI_SYSICONINDEX | SHGFI_USEFILEATTRIBUTES)) {
					if (sfi.iIcon != iUndef) {
						iIcon = sfi.iIcon;
					}
				}
			} else if (api.SHGetFileInfo(api.ILCreateFromPath(ExtractMacro(te, type)), 0, sfi, sfi.Size, SHGFI_SYSICONINDEX | SHGFI_PIDL)) {
				if (sfi.iIcon != iUndef) {
					iIcon = sfi.iIcon;
				}
			}
			if (iIcon >= 0) {
				let hIcon;
				for (let j in te.Data.SHIL) {
					if (a[j] && te.Data.SHIL[j]) {
						const fn = ExtractPath(te, a[j]);
						if (api.PathMatchSpec(fn, "*.ico")) {
							api.SHGetFileInfo(fn, 0, sfi, sfi.Size, SHGFI_SYSICONINDEX);
							hIcon = api.ImageList_GetIcon(te.Data.SHIL[j], sfi.iIcon, ILD_NORMAL);
						} else if (image) {
							api.ImageList_GetIconSize(te.Data.SHIL[j], size);
							if (!image.FromFile(fn)) {
								hIcon = MakeImgIcon(fn, 0, size.cy);
								image.FromHICON(hIcon);
								api.DestroyIcon(hIcon);
							}
							if (image.GetWidth() != size.cx || image.GetHeight() != size.cy) {
								image = image.GetThumbnailImage(size.cx, size.cy);
							}
							if (image) {
								hIcon = image.GetHICON();
							}
						}
						if (hIcon) {
							api.ImageList_ReplaceIcon(te.Data.SHIL[j], iIcon, hIcon);
							api.DestroyIcon(hIcon);
						}
					}
				}
			}
		}
	}
});
