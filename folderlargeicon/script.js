var Addon_Id = "folderlargeicon";
var item = GetAddonElement(Addon_Id);

Addons.FolderLargeIcon = {
	Icon: [],
	fStyle: LVIS_CUT | LVIS_SELECTED,

	GetIconImage: function (fn)
	{
		return ;
	},

	IsFolder: function (Item)
	{
		if (Item && Item.IsFolder && !api.ILIsParent(ssfBITBUCKET, Item, true)) {
			var wfd = api.Memory("WIN32_FIND_DATA");
			var hr = api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size);
			return !hr && (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) && !api.PathIsRoot(Item.Path);
		}
		return false;
	}
};

if (window.Addon == 1) {
	AddEvent("Load", function ()
	{
		var fn = api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("Icon")));
		if (fn) {
			var m = api.LowPart(item.getAttribute("IconSize")) || 48;
			Addons.FolderLargeIcon.Icon = GetThumbnail(te.WICBitmap().FromFile(fn) || MakeImgData(fn, 0, m), m);
		}

		AddEvent("HandleIcon", function (Ctrl, pid)
		{
			if (Ctrl.hwndList && Ctrl.IconSize >= 32 && Addons.FolderLargeIcon.IsFolder(pid)) {
				if (Addons.FolderLargeIcon.Icon) {
					return true;
				}
			}
		});

		AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd)
		{
			var hList = Ctrl.hwndList;
			if (hList && Ctrl.IconSize >= 32 && Addons.FolderLargeIcon.IsFolder(pid))  {
				var image = Addons.FolderLargeIcon.Icon;
				if (/object/i.test(typeof image)) {
					var cl, fStyle, rc = api.Memory("RECT");
					rc.Left = LVIR_ICON;
					api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
					var state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Addons.FolderLargeIcon.fStyle);
					if (state == LVIS_SELECTED) {
						cl = CLR_DEFAULT;
						fStyle = api.GetFocus() == hList ? ILD_SELECTED : ILD_FOCUS;
					} else {
						cl = CLR_NONE;
						fStyle = (state & LVIS_CUT) || api.GetAttributesOf(pid, SFGAO_HIDDEN) ? ILD_SELECTED : ILD_NORMAL;
					}
					image = GetThumbnail(image, Ctrl.IconSize * screen.logicalYDPI / 96, Ctrl.IconSize >= 32);
					image.DrawEx(nmcd.hdc, rc.Left + (rc.Right - rc.Left - image.GetWidth()) / 2, rc.Top + (rc.Bottom - rc.Top - image.GetHeight()) / 2, 0, 0, cl, cl, fStyle);
					return S_OK;
				}
			}
		});

		if (api.IsAppThemed() && WINVER >= 0x600) {
			AddEvent("Load", function ()
			{
				if (!Addons.ClassicStyle) {
					Addons.FolderLargeIcon.fStyle = LVIS_CUT;
				}
			});
		}
	});
}
