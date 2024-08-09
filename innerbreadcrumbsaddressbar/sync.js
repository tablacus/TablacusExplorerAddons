Sync.InnerBreadcrumbsAddressBar = {
	GetPath: function (n, Id) {
		let FolderItem = 0;
		const FV = GetInnerFV(Id);
		if (FV) {
			for (FolderItem = FV.FolderItem; n > 0; n--) {
				FolderItem = api.ILGetParent(FolderItem);
			}
		}
		return FolderItem;
	},

	SplitPath: function (FolderItem) {
		const bRoot = api.ILIsEmpty(FolderItem);
		const Items = [];
		let n = 0;
		do {
			Items.push({
				next: n || api.GetAttributesOf(FolderItem, SFGAO_HASSUBFOLDER),
				name: GetFolderItemName(FolderItem)
			});
			FolderItem = api.ILGetParent(FolderItem);
			n++;
		} while (!api.ILIsEmpty(FolderItem) && n < 99);
		Items[0].bRoot = bRoot;
		return JSON.stringify(Items);
	}
}

AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo) {
	if (msg == WM_MOUSEMOVE && Ctrl.Type == CTRL_TE && Common.InnerBreadcrumbsAddressBar.nLoopId && Common.InnerBreadcrumbsAddressBar.rcItem) {
		const ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		if (!PtInRect(Common.InnerBreadcrumbsAddressBar.Item, ptc)) {
			for (let i = Common.InnerBreadcrumbsAddressBar.rcItem.length; i-- > 0;) {
				if (PtInRect(Common.InnerBreadcrumbsAddressBar.rcItem[i], ptc)) {
					api.PostMessage(hwnd, WM_KEYDOWN, VK_ESCAPE, 0);
					InvokeUI("Addons.InnerBreadcrumbsAddressBar.ChangeMenu", [Common.InnerBreadcrumbsAddressBar.nLoopId, i]);
					break;
				}
			}
		}
	}
});

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		InvokeUI("Addons.InnerBreadcrumbsAddressBar.SetRects");
		return S_OK;
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB && dataObj.Count) {
		const ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		for (let Id in Common.InnerBreadcrumbsAddressBar.rcItems) {
			const rcItem = Common.InnerBreadcrumbsAddressBar.rcItems[Id];
			for (let i = rcItem.length; i-- > 0;) {
				if (PtInRect(rcItem[i], ptc)) {
					const Target = Sync.InnerBreadcrumbsAddressBar.GetPath(i, Id);
					if (!api.ILIsEqual(dataObj.Item(-1), Target)) {
						const DropTarget = api.DropTarget(Target);
						if (DropTarget) {
							MouseOver("breadcrumbsaddressbar_" + Id + "_" + i + "_");
							return DropTarget.DragOver(dataObj, grfKeyState, pt, pdwEffect);
						}
					}
					pdwEffect[0] = DROPEFFECT_NONE;
					return S_OK;
				}
			}
		}
	}
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB && dataObj.Count) {
		const ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		for (let Id in Common.InnerBreadcrumbsAddressBar.rcItems) {
			const rcItem = Common.InnerBreadcrumbsAddressBar.rcItems[Id];
			for (let i = rcItem.length; i-- > 0;) {
				if (PtInRect(rcItem[i], ptc)) {
					let hr = S_FALSE;
					const Target = Sync.InnerBreadcrumbsAddressBar.GetPath(i, Id);
					if (!api.ILIsEqual(dataObj.Item(-1), Target)) {
						const DropTarget = api.DropTarget(Target);
						if (DropTarget) {
							hr = DropTarget.Drop(dataObj, grfKeyState, pt, pdwEffect);
						}
					}
					return hr;
				}
			}
		}
	}
});

AddEvent("DragLeave", function (Ctrl) {
	MouseOut("breadcrumbsaddressbar_");
	return S_OK;
});
