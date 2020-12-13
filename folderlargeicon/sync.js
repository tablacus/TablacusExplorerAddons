const Addon_Id = "folderlargeicon";
const item = GetAddonElement(Addon_Id);

Sync.FolderLargeIcon = {
	Icon: [],
	fStyle: LVIS_CUT | LVIS_SELECTED,
	Path: ExtractPath(te, item.getAttribute("Icon")),
	Size: GetNum(item.getAttribute("IconSize")) || 48,

	IsFolder: function (Item) {
		if (Item && Item.IsFolder && !api.ILIsParent(ssfBITBUCKET, Item, true)) {
			const wfd = api.Memory("WIN32_FIND_DATA");
			const hr = api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size);
			return !hr && (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) && !api.PathIsRoot(Item.Path);
		}
		return false;
	},

	SetStyle: function () {
		Sync.FolderLargeIcon.fStyle = LVIS_CUT;
	}
};

if (Sync.FolderLargeIcon.Path) {
	AddEvent("Load", function () {
		Sync.FolderLargeIcon.Icon = GetThumbnail(api.CreateObject("WICBitmap").FromFile(Sync.FolderLargeIcon.Path) || MakeImgData(Sync.FolderLargeIcon.Path, 0, Sync.FolderLargeIcon.Size), Sync.FolderLargeIcon.Size);

		AddEvent("HandleIcon", function (Ctrl, pid) {
			if (Ctrl.hwndList && Ctrl.IconSize >= 32 && Sync.FolderLargeIcon.IsFolder(pid)) {
				if (Sync.FolderLargeIcon.Icon && Sync.FolderLargeIcon.Icon.GetWidth) {
					return true;
				}
			}
		});

		AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd) {
			const hList = Ctrl.hwndList;
			if (hList && Ctrl.IconSize >= 32 && Sync.FolderLargeIcon.IsFolder(pid)) {
				let image = Sync.FolderLargeIcon.Icon;
				if (image.GetWidth) {
					let cl, fStyle, rc = api.Memory("RECT");
					rc.Left = LVIR_ICON;
					api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
					const state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Sync.FolderLargeIcon.fStyle);
					if (state == LVIS_SELECTED) {
						cl = CLR_DEFAULT;
						fStyle = api.GetFocus() == hList ? ILD_SELECTED : ILD_FOCUS;
					} else {
						cl = CLR_NONE;
						fStyle = (state & LVIS_CUT) || api.GetAttributesOf(pid, SFGAO_HIDDEN) ? ILD_SELECTED : ILD_NORMAL;
					}
					image = GetThumbnail(image, Ctrl.IconSize * screen.deviceYDPI / 96, Ctrl.IconSize >= 32);
					image.DrawEx(nmcd.hdc, rc.Left + (rc.Right - rc.Left - image.GetWidth()) / 2, rc.Top + (rc.Bottom - rc.Top - image.GetHeight()) / 2, 0, 0, cl, cl, fStyle);
					return S_OK;
				}
			}
		});
	});
}
