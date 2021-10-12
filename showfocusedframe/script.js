if (window.Addon == 1) {
	AddEvent("NavigateComplete", async function (Ctrl) {
		const hList = await Ctrl.hwndList;
		if (hList) {
			api.PostMessage(hList, WM_KEYDOWN, VK_CLEAR, 0);
			api.PostMessage(hList, WM_KEYUP, VK_CLEAR, 0);
		}
	});
}
