var Addon_Id = "menuimage";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("MenuExec", 1);
		item.setAttribute("Menu", "Context");
		item.setAttribute("MenuPos", -1);
	}
}
if (window.Addon == 1) {
	Addons.MenuImage = {
		Size: 512,
	};
	if (items.length) {
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.MenuImage.nPos = api.LowPart(item.getAttribute("MenuPos"));
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
			{
				for (var i = Selected ? Selected.Count : 0; i-- > 0;) {
					item = Selected.Item(i);
					if (item && item.IsFileSystem) {
						var mii = api.Memory("MENUITEMINFO");
						mii.cbSize = mii.Size;
						mii.fMask  = MIIM_ID | MIIM_BITMAP | MIIM_STRING | MIIM_SUBMENU;
						var Image = te.GdiplusBitmap();
						Image.FromFile(item.Path);
						var width = Image.GetWidth();
						var height = Image.GetHeight();
						if (width && height) {
							var thum = Image;
							if (width > Addons.MenuImage.Size || height > Addons.MenuImage.Size) {
								if (width > height) {
									height = Addons.MenuImage.Size * height / width;
									width = Addons.MenuImage.Size;
								}
								else {
									width = Addons.MenuImage.Size * width / height;
									height = Addons.MenuImage.Size;
								}
								thum = Image.GetThumbnailImage(width, height);
							}
							var hBM = thum.GetHBITMAP(api.GetSysColor(COLOR_MENU));
							if (hBM) {
								g_arBM.push(hBM);
								mii.hSubMenu = api.CreatePopupMenu();
								var mii2 = api.Memory("MENUITEMINFO");
								mii2.cbSize = mii.Size;
								mii2.fMask  = MIIM_ID | MIIM_BITMAP;
								mii2.hbmpItem = hBM;
								api.InsertMenuItem(mii.hSubMenu, 0, true, mii2);

								mii.dwTypeData = item.Name;
								api.InsertMenuItem(hMenu, Addons.MenuImage.nPos, true, mii);
							}
						}
					}
				}
				return nPos;
			});
		}
	}
}
