if (window.Addon == 1) {
	Addons.FolderIcon = {
		clWindow: await GetSysColor(COLOR_WINDOW)
	}

	AddEvent("ChangeView1", async function (Ctrl) {
		const icon = await GetIconImage(Ctrl, Addons.FolderIcon.clWindow, true);
		let hIcon = await MakeImgIcon(icon, 0, 16);
		if (!hIcon) {
			const image = await api.CreateObject("WICBitmap").FromFile(icon);
			if (image) {
				hIcon = await image.GetHICON();
			}
		}
		api.SendMessage(ui_.hwnd, WM_SETICON, ICON_SMALL, hIcon);
	});
}
