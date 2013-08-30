AddEvent("Favorites", function (Ctrl, hMenu, nPos)
{
		var menus = te.Data.xmlMenus.getElementsByTagName("Favorites");
		if (menus && menus.length) {
			var items = menus[0].getElementsByTagName("Item");
			if (items) {
				for (var i = items.length; i > 0; i--) {
					var item = items[i - 1];
					if (item.getAttribute("Type") == "Open") {
						(function (Ctrl, item)
						{
							ExtraMenuCommand[i] = function (Ctrl, pt)
							{
								Exec(te, item.text, "Open in New Tab", te.hwnd);
								return S_OK;
							};
						})(Ctrl, item);
					}
				}
			}
		}
	return nPos;
});
