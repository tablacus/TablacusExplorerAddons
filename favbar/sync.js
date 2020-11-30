AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		return S_OK;
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
		if (menus && menus.length) {
			var items = menus[0].getElementsByTagName("Item");
			var i = Addons.FavBar.FromPt(items.length, pt);
			if (i >= 0) {
				hr = Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect);
				return S_OK;
			}
		}
		if (HitTest(Addons.FavBar.Parent, pt) && dataObj.Count) {
			pdwEffect[0] = DROPEFFECT_LINK;
			return S_OK;
		}
	}
	MouseOut("_favbar");
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	MouseOut();
	if (Ctrl.Type == CTRL_WB) {
		var menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
		if (menus && menus.length) {
			var items = menus[0].getElementsByTagName("Item");
			var i = Addons.FavBar.FromPt(items.length + 1, pt);
			if (i >= 0) {
				return Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect, true);
			}
		}
		if (HitTest(Addons.FavBar.Parent, pt) && dataObj.Count) {
			setTimeout(function () {
				AddFavorite(dataObj.Item(0));
			}, 99);
			return S_OK;
		}
	}
});
