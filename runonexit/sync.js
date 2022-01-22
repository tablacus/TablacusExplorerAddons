AddEvent("Close", function (Ctrl) {
	if (Ctrl.Type == CTRL_TE) {
		const item = GetAddonElement("runonexit");
		Exec(te, item.text || item.textContent || item.getAttribute("Path"), item.getAttribute("Type"), te.hwnd);
	}
}, true);
