Common.FavoritesBar.rcItem = api.CreateObject("Array");

Sync.FavoritesBar = {
	FromPt: function (ptc) {
		for (let i = Common.FavoritesBar.rcItem.length; i-- > 0;) {
			if (PtInRect(Common.FavoritesBar.rcItem[i], ptc)) {
				return i;
			}
		}
		return -1;
	}
}

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		InvokeUI("Addons.FavoritesBar.SetRects");
		return S_OK;
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		const ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		const i = Sync.FavoritesBar.FromPt(ptc);
		if (i >= 0) {
			if (Common.FavoritesBar.drag5) {
				const d = Common.FavoritesBar.drag5.replace(/\D/g, "") - 0;
				if (i < d || i >= d + Common.FavoritesBar.count5) {
					pdwEffect[0] = DROPEFFECT_MOVE;
					MouseOver("fav" + i);
					return S_OK;
				}
			} else {
				const menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
				if (menus && menus.length) {
					const items = menus[0].getElementsByTagName("Item");
					hr = Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect);
					if (hr == S_OK && pdwEffect[0]) {
						MouseOver("fav" + i);
					}
					return hr;
				}
			}
		}
		if (dataObj.Count && PtInRect(Common.FavoritesBar.rc, ptc)) {
			pdwEffect[0] = DROPEFFECT_LINK;
			MouseOut();
			return S_OK;
		}
	}
	MouseOut();
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	MouseOut();
	if (Ctrl.Type == CTRL_WB) {
		const ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		const menus = te.Data.xmlMenus.getElementsByTagName('Favorites');
		if (menus && menus.length) {
			const i = Sync.FavoritesBar.FromPt(ptc);
			if (i >= 0) {
				if (Common.FavoritesBar.drag5) {
					api.OutputDebugString(["Drop", i, Common.FavoritesBar.drag5].join(",") + "\n");
					let src = Common.FavoritesBar.drag5.replace(/\D/g, "") - 0;
					let dst = i;
					api.OutputDebugString(["Drop", src, dst].join(",") + "\n");
					const xml = te.Data.xmlMenus;
					const items = menus[0].getElementsByTagName("Item");
					const stack = [];
					let nCount = Common.FavoritesBar.count5;
					for (let i = 0; i < items.length; ++i) {
						if (i >= src && i < src + nCount) {
							continue;
						}
						stack.push(items[i]);
					}
					if (dst > src) {
						dst -= nCount - 1;
					}
					while (nCount-- > 0) {
						stack.splice(dst++, 0, items[src++]);
					}
					items.removeAll();
					while (stack.length) {
						menus[0].appendChild(stack.shift());
					}
					SaveXmlEx("menus.xml", xml);
					FavoriteChanged();
					return S_OK;
				} else {
					const items = menus[0].getElementsByTagName("Item");
					return Exec(te, items[i].text, items[i].getAttribute("Type"), te.hwnd, pt, dataObj, grfKeyState, pdwEffect, true);
				}
			}
		}
		if (dataObj.Count && PtInRect(Common.FavoritesBar.rc, ptc)) {
			InvokeUI("AddFavorite", [dataObj.Item(0)]);
			return S_OK;
		}
	}
});

AddEvent("DragLeave", MouseOut);
