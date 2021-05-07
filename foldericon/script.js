if (window.Addon == 1) {
	AddEvent("ChangeView1", async function (Ctrl) {
		const icon = await GetIconImage(Ctrl, CLR_DEFAULT | COLOR_WINDOW, true);
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
