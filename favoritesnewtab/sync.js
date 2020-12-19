AddEvent("Favorites", function (Ctrl, hMenu, nPos) {
	const menus = te.Data.xmlMenus.getElementsByTagName("Favorites");
	if (menus && menus.length) {
		const items = menus[0].getElementsByTagName("Item");
		if (items) {
			for (let i = items.length; i > 0; i--) {
				const item = items[i - 1];
				if (SameText(item.getAttribute("Type"), "Open")) {
					(function (Ctrl, item) {
						ExtraMenuCommand[i] = function (Ctrl, pt) {
							Exec(te, item.text, "Open in new tab", te.hwnd);
							return S_OK;
						};
					})(Ctrl, item);
				}
			}
		}
	}
	return nPos;
});
