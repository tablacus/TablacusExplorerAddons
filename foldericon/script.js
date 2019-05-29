if (window.Addon == 1) {
	AddEvent("ChangeView", function (Ctrl)
	{
		if (Ctrl.FolderItem && Ctrl.Id == Ctrl.Parent.Selected.Id && Ctrl.Parent.Id == te.Ctrl(CTRL_TC).Id) {
			var icon = GetIconImage(Ctrl, api.GetSysColor(COLOR_WINDOW), true);
			var hIcon = MakeImgIcon(icon, 0, 16);
			if (!hIcon) {
				var image = api.CreateObject("WICBitmap").FromFile(icon);
				if (image) {
					hIcon = image.GetHICON();
				}
			}
			api.SendMessage(te.hwnd, WM_SETICON, ICON_SMALL, hIcon);
		}
	});
}
