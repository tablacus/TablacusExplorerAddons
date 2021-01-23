Common.FavBar = api.CreateObject("Object");
Common.FavBar.Items = api.CreateObject("Array");

Sync.FavBar = {
	FromPt: function (i, ptc) {
		while (--i >= 0) {
			if (PtInRect(Common.FavBar.Items[i], ptc)) {
				return i;
			}
		}
		return -1;
	}
}

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		InvokeUI("Addons.FavBar.SetRects");
		return S_OK;
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		const ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		const menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
		if (menus && menus.length) {
			const items = menus[0].getElementsByTagName("Item");
			const i = Sync.FavBar.FromPt(items.length, ptc);
			if (i >= 0) {
				hr = Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect);
				return S_OK;
			}
		}
		if (dataObj.Count && PtInRect(Common.FavBar.Append, ptc)) {
			pdwEffect[0] = DROPEFFECT_LINK;
			return S_OK;
		}
	}
	MouseOut("_favbar");
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	MouseOut();
	if (Ctrl.Type == CTRL_WB) {
		const ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		const menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
		if (menus && menus.length) {
			const items = menus[0].getElementsByTagName("Item");
			const i = Sync.FavBar.FromPt(items.length, ptc);
			if (i >= 0) {
				return Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect, true);
			}
		}
		if (dataObj.Count && PtInRect(Common.FavBar.Append, ptc)) {
			setTimeout(function () {
				AddFavorite(dataObj.Item(0));
			}, 99);
			return S_OK;
		}
	}
});
