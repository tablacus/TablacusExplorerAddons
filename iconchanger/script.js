var Addon_Id = "iconchanger";

if (window.Addon == 1) {
	AddEvent("Load", function ()
	{
		var ar = [];
		try {
			var f = fso.OpenTextFile(fso.BuildPath(te.Data.DataFolder, "config\\iconchanger.tsv"), 1, false, -1);
			while (!f.AtEndOfStream) {
				ar.push(f.ReadLine());
			}
			f.Close();
		} catch (e) {}
		if (ar.length) {
			var size = api.Memory("SIZE");
			var sfi = api.Memory("SHFILEINFO");
			api.SHGetFileInfo("*", 0, sfi, sfi.Size, SHGFI_SYSICONINDEX | SHGFI_USEFILEATTRIBUTES);
			var iUndef = sfi.iIcon;

			for (var i = ar.length; i--;) {
				var image = api.CreateObject("WICBitmap");
				var a = ar[i].split(/\t/);
				var type = a.shift();
				var typelc = String(type).toLowerCase();
				var iIcon = -1;
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
					var hIcon;
					for (var j in te.Data.SHIL) {
						if (a[j] && te.Data.SHIL[j]) {
							var fn = api.PathUnquoteSpaces(ExtractMacro(te, a[j]));
							if (api.PathMatchSpec(fn, "*.ico")) {
								api.SHGetFileInfo(fn, 0, sfi, sfi.Size, SHGFI_SYSICONINDEX);
								hIcon = api.ImageList_GetIcon(te.Data.SHIL[j], sfi.iIcon, ILD_NORMAL);
							} else if (image) {
								api.ImageList_GetIconSize(te.Data.SHIL[j], size);
								if (!image.FromFile(fn)) {
									var hIcon = MakeImgIcon(fn, 0, size.cy);
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
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
