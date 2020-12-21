if (window.Addon == 1) {
	AddEvent("DragEnter", async function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
		if (await Ctrl.Type <= CTRL_EB) {
			api.SetWindowTheme(await Ctrl.hwndList, "explorer", null);
		}
	});

	AddEvent("DragLeave", async function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
		if (await Ctrl.Type <= CTRL_EB && Addons.ClassicStyle) {
			api.SetWindowTheme(await Ctrl.hwndList, null, null);
		}
	});
}
