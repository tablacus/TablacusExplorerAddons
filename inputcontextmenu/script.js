if (window.Addon == 1) {
	AddEvent("BrowserCreatedEx", await ReadTextFile("addons\\inputcontextmenu\\handler.js"));
	document.addEventListener("keydown", async function (ev) {
		if (ev.ctrlKey && (ev.key ? ev.key.toLowerCase() === 'f' : ev.keyCode == 70)) {
			PreventDefault(ev);
			const wb = await WebBrowser;
			KeyExecEx(wb, "All", 8225, await wb.hwnd)
		}
	}, true)
}
