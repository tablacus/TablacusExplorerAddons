Sync.Tabs = {
	Init: function (Ctrl) {
		api.SendMessage(Ctrl.hwnd, WM_SETFONT, Sync.Tabs.hFont, 1);
		api.SendMessage(Ctrl.hwnd, TCM_SETIMAGELIST, 0, Sync.Tabs.himl);
	},

	Over: function () {
		var pt = api.Memory("POINT");
		api.GetCursorPos(pt);
		if (!IsDrag(pt, g_ptDrag)) {
			var Ctrl = te.CtrlFromPoint(pt);
			if (Ctrl && Ctrl.Type == CTRL_TC) {
				var nIndex = Ctrl.HitTest(pt, TCHT_ONITEM);
				if (nIndex >= 0) {
					Ctrl.SelectedIndex = nIndex;
				}
			}
		}
	}
};

AddEvent("ToolTip", function (Ctrl, Index) {
	if (Ctrl.Type == CTRL_TC) {
		var FV = Ctrl.Item(Index);
		if (FV) {
			return api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		}
	}
});

AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo) {
	if (Ctrl.Type == CTRL_TC) {
		if (!Sync.Tabs.DragTab) {
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				if (IsDrag(pt, te.Data.pt)) {
					g_.mouse.str = "";
					SetGestureText(Ctrl, "");
					te.Data.pt = null;
					var i = Ctrl.HitTest(pt, TCHT_ONITEM);
					if (i >= 0) {
						var pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
						Sync.Tabs.DragTab = Ctrl;
						Sync.Tabs.DragIndex = i;
						api.SHDoDragDrop(null, Ctrl[i].FolderItem, te, pdwEffect[0], pdwEffect);
						Sync.Tabs.DragTab = null;
					}
				}
			}
		}
	}
});

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_TC) {
		if (Sync.Tabs.DragTab) {
			pdwEffect[0] = DROPEFFECT_LINK;
		}
		return S_OK;
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_TC) {
		var nIndex = Ctrl.HitTest(pt, TCHT_ONITEM);
		if (nIndex >= 0) {
			if (IsDrag(pt, g_ptDrag)) {
				clearTimeout(Sync.Tabs.tid);
				g_ptDrag = pt.Clone();
				Sync.Tabs.tid = setTimeout(Sync.Tabs.Over, 300);
			}
		}
		var nDragTab = Sync.Tabs.DragIndex;
		if (Sync.Tabs.DragTab && nDragTab >= 0) {
			pdwEffect[0] = DROPEFFECT_MOVE;
			return S_OK;
		}
		if (nIndex >= 0) {
			if (dataObj.Count) {
				var Target = Ctrl.Item(nIndex).FolderItem;
				if (!api.ILIsEqual(dataObj.Item(-1), Target)) {
					var DropTarget = api.DropTarget(Target);
					if (DropTarget) {
						hr = DropTarget.DragOver(dataObj, grfKeyState, pt, pdwEffect);
						return hr;
					}
				}
			}
			pdwEffect[0] = DROPEFFECT_NONE;
			return S_OK;
		}
		if (dataObj.Item(0) && dataObj.Item(0).IsFolder) {
			pdwEffect[0] = DROPEFFECT_LINK;
			return S_OK;
		}
	}
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_TC) {
		var nIndex = Ctrl.HitTest(pt, TCHT_ONITEM);
		if (Sync.Tabs.DragTab) {
			pdwEffect[0] = DROPEFFECT_LINK;
			if (nIndex < 0) {
				nIndex = Ctrl.Count;
			}
			Sync.Tabs.DragTab.Move(Sync.Tabs.DragIndex, nIndex, Ctrl);
			Ctrl.SelectedIndex = nIndex;
		} else if (nIndex >= 0) {
			var hr = S_FALSE;
			var DropTarget = Ctrl.Item(nIndex).DropTarget;
			if (DropTarget) {
				clearTimeout(Sync.Tabs.tid);
				hr = DropTarget.Drop(dataObj, grfKeyState, pt, pdwEffect);
			}
			return hr;
		} else if (dataObj.Count) {
			for (var i = 0; i < dataObj.Count; i++) {
				var FV = Ctrl.Selected.Navigate(dataObj.Item(i), SBSP_NEWBROWSER);
				Ctrl.Move(FV.Index, Ctrl.Count - 1);
			}
		}
	}
});

AddEvent("DragLeave", function (Ctrl) {
	clearTimeout(Sync.Tabs.tid);
	Sync.Tabs.tid = null;
	return S_OK;
});

AddEvent("TabViewCreated", function (Ctrl) {
	Sync.Tabs.Init(Ctrl);
});

AddEvent("Lock", function (Ctrl, i, bLock) {
	var tcItem = api.Memory("TCITEM");
	tcItem.mask = TCIF_IMAGE;
	tcItem.iImage = bLock ? 2 : -1;
	api.SendMessage(Ctrl.hwnd, TCM_SETITEM, i, tcItem);
	Resize();
});

AddEvent("FontChanged", function () {
	Sync.Tabs.hFont = CreateFont(DefaultFont);
});

AddEvent("Finalize", function () {
	if (Sync.Tabs.himl) {
		api.ImageList_Destroy(Sync.Tabs.himl);
		Sync.Tabs.himl = null;
	}
});

AddEvent("Load", function () {
	var hModule = api.GetModuleHandle(BuildPath(system32, "ieframe.dll"), 0, LOAD_LIBRARY_AS_DATAFILE) || api.GetModuleHandle(BuildPath(system32, "browseui.dll"), 0, LOAD_LIBRARY_AS_DATAFILE);
	if (hModule) {
		Sync.Tabs.himl = api.ImageList_LoadImage(hModule, 545, 13, 0, CLR_DEFAULT, IMAGE_BITMAP, LR_CREATEDIBSECTION);
	}
	Sync.Tabs.hFont = CreateFont(DefaultFont);

	var cTC = te.Ctrls(CTRL_TC);
	for (var i = cTC.length; i-- > 0;) {
		Sync.Tabs.Init(cTC[i]);
	}
});

