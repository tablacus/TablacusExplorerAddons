var Addon_Id = "iconchanger";

if (window.Addon == 1) {
	var ar = [];
	try {
		var f = fso.OpenTextFile(fso.BuildPath(te.Data.DataFolder, "config\\iconchanger.tsv"), 1, false, -1);
		while (!f.AtEndOfStream) {
			ar.push(f.ReadLine());
		}
		f.Close();
	}
	catch (e) {
	}
	if (ar.length) {
		var arHiml = [];
		var size = api.Memory("SIZE");
		for (var j = SHIL_JUMBO; j--;) {
			arHiml[j] = api.SHGetImageList(j);
		}

		var info = api.Memory("SHFILEINFO");
		api.ShGetFileInfo("*", 0, info, info.Size, SHGFI_SYSICONINDEX | SHGFI_USEFILEATTRIBUTES);
		var iUndef = info.iIcon;
		var image = te.GdiplusBitmap();

		for (var i = ar.length; i--;) {
			var a = ar[i].split(/\t/);
			var type = a.shift();
			var iIcon = -1;
			if (api.strcmpi(type, "Folder closed") == 0) {
				api.ShGetFileInfo("*", FILE_ATTRIBUTE_DIRECTORY, info, info.Size, SHGFI_SYSICONINDEX | SHGFI_USEFILEATTRIBUTES);
				iIcon = info.iIcon;
			}
			else if (api.strcmpi(type, "Folder opened") == 0) {
				api.ShGetFileInfo("*", FILE_ATTRIBUTE_DIRECTORY, info, info.Size, SHGFI_SYSICONINDEX | SHGFI_OPENICON | SHGFI_USEFILEATTRIBUTES);
				iIcon = info.iIcon;
			}
			else if (api.strcmpi(type, "Undefined") == 0) {
				iIcon = iUndef;
			}
			else if (api.strcmpi(type, "Share") == 0) {
				iIcon = api.ImageList_GetOverlayImage(arHiml[0], 1);
			}
			else if (api.strcmpi(type, "Shortcut") == 0) {
				iIcon = api.ImageList_GetOverlayImage(arHiml[0], 2);
			}
			else {
				if (api.ShGetFileInfo(type, 0, info, info.Size, SHGFI_SYSICONINDEX | (type.match(/\*/) ? SHGFI_USEFILEATTRIBUTES : 0))) {
					if (info.iIcon != iUndef) {
						iIcon = info.iIcon;
					}
				}
			}
			if (iIcon >= 0) {
				var hIcon;
				for (var j = arHiml.length; j--;) {
					if (a[j] && arHiml[j]) {
						var fn = api.PathUnquoteSpaces(a[j]);
						if (api.PathMatchSpec(fn, "*.ico")) {
							api.ShGetFileInfo(fn, 0, info, info.Size, SHGFI_SYSICONINDEX);
							hIcon = api.ImageList_GetIcon(arHiml[j], info.iIcon, ILD_NORMAL);
						}
						else {
							image.FromFile(fn);
							api.ImageList_GetIconSize(arHiml[j], size);
							if (image.GetWidth() != size.cx || image.GetHeight() != size.cy) {
								image = image.GetThumbnailImage(size.cx, size.cy);
							}
							hIcon = image.GetHICON();
						}
						if (hIcon) {
							api.ImageList_ReplaceIcon(arHiml[j], iIcon, hIcon);
							api.DestroyIcon(hIcon);
						}
					}
				}
			}
		}
	}
}
