if (window.Addon == 1) {
	Addons.Tabs =
	{
		tid: null,

		Init: function (Ctrl)
		{
			var LogFont = api.Memory("LOGFONT");
			api.SystemParametersInfo(SPI_GETICONTITLELOGFONT, LogFont.Size, LogFont, 0);
			var hFont = api.CreateFontIndirect(LogFont);
			api.SendMessage(Ctrl.hwnd, WM_SETFONT, hFont, 1);
			api.SendMessage(Ctrl.hwnd, TCM_SETIMAGELIST, 0, this.himl);
		},

		Over: function ()
		{
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
	window.OpenMode = GetAddonOption("tabs", "NewTab") ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER;

	AddEvent("ToolTip", function (Ctrl, Index)
	{
		if (Ctrl.Type == CTRL_TC) {
			var FV = Ctrl.Item(Index);
			if (FV) {
				return api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			}
		}
	});

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo)
	{
		if (Ctrl.Type == CTRL_TC) {
			if (!te.Data.DragTab) {
				if (api.GetKeyState(VK_LBUTTON) < 0) {
					if (IsDrag(pt, te.Data.pt)) {
						g_mouse.str = "";
						SetGestureText(Ctrl, "");
						te.Data.pt = null;
						var i = Ctrl.HitTest(pt, TCHT_ONITEM);
						if (i >= 0) {
							var pdwEffect = api.Memory("DWORD");
							pdwEffect.Item(0) = DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK;
							te.Data.DragTab = Ctrl;
							te.Data.DragIndex = i;
							api.DoDragDrop(Ctrl.Item(i).FolderItem, pdwEffect.Item(0), pdwEffect);
							te.Data.DragTab = null;
						}
					}
				}
			}
		}
	});

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_TC) {
			if (te.Data.DragTab) {
				pdwEffect.X = DROPEFFECT_LINK;
			}
			return S_OK;
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_TC) {
			var nIndex = Ctrl.HitTest(pt, TCHT_ONITEM);
			if (nIndex >= 0) {
				if (IsDrag(pt, g_ptDrag)) {
					clearTimeout(Addons.Tabs.tid);
					g_ptDrag = pt.Clone();
					Addons.Tabs.tid = setTimeout(Addons.Tabs.Over, 300);
				}
			}
			var nDragTab = te.Data.DragIndex;
			if (te.Data.DragTab && nDragTab >= 0) {
				pdwEffect.X = (nDragTab != nIndex) ? DROPEFFECT_LINK : DROPEFFECT_NONE;
				return S_OK;
			}
			else if (nIndex >= 0) {
				if (dataObj.Count) {
					var Target = Ctrl.Item(nIndex).FolderItem;
					if (!api.ILIsEqual(dataObj.Item(-1), Target)) {
						var DropTarget = api.DropTarget(Target);
						if (DropTarget) {
							return DropTarget.DragOver(dataObj, grfKeyState, pt, pdwEffect);
						}
					}
				}
				pdwEffect.X = DROPEFFECT_NONE;
				return S_OK;
			}
			else if (dataObj.Item(0) && dataObj.Item(0).IsFolder) {
				pdwEffect.X = DROPEFFECT_LINK;
				return S_OK;
			}
		}
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_TC) {
			var nIndex = Ctrl.HitTest(pt, TCHT_ONITEM);
			if (te.Data.DragTab) {
				pdwEffect.X = DROPEFFECT_LINK;
				if (nIndex < 0) {
					nIndex = Ctrl.Count;
				}
				te.Data.DragTab.Move(te.Data.DragIndex, nIndex, Ctrl);
				Ctrl.SelectedIndex = nIndex;
			}
			else if (nIndex >= 0) {
				Ctrl.SelectedIndex = nIndex;
				var DropTarget = Ctrl.Item(nIndex).DropTarget;
				if (DropTarget) {
					return DropTarget.Drop(dataObj, grfKeyState, pt, pdwEffect);
				}
			}
			else if (dataObj.Count) {
				for (var i = 0; i < dataObj.Count; i++) {
					var FV = Ctrl.Selected.Navigate(dataObj.Item(i), SBSP_NEWBROWSER | SBSP_ACTIVATE_NOFOCUS);
					Ctrl.Move(FV.Index, Ctrl.Count - 1);
				}
			}
		}
	});

	AddEvent("Dragleave", function (Ctrl)
	{
		clearTimeout(Addons.Tabs.tid);
		Addons.Tabs.tid = null;
		return S_OK;
	});

	AddEvent("TabViewCreated", function (Ctrl)
	{
		Addons.Tabs.Init(Ctrl);
	});

	AddEventEx(window, "load", function ()
	{
		var cTC = te.Ctrls(CTRL_TC);
		for (var i = cTC.Count; i--;) {
			Addons.Tabs.Init(cTC[i]);
		}
	});

	AddEvent(window, "Finalize", function ()
	{
		if (Addons.Tabs.himl) {
			api.ImageList_Destroy(Addons.Tabs.himl);
			Addons.Tabs.himl = null;
		}
	});

	var hModule = api.GetModuleHandle(fso.BuildPath(system32, "ieframe.dll"), 0, LOAD_LIBRARY_AS_DATAFILE) || api.GetModuleHandle(fso.BuildPath(system32, "browseui.dll"), 0, LOAD_LIBRARY_AS_DATAFILE);
	if (hModule) {
		Addons.Tabs.himl = api.ImageList_LoadImage(hModule, 545, 13, 0, CLR_DEFAULT, IMAGE_BITMAP, LR_CREATEDIBSECTION);
	}

	AddEvent("Lock", function (Ctrl, i, bLock)
	{
		var tcItem = api.Memory("TCITEM");
		tcItem.mask = TCIF_IMAGE;
		tcItem.iImage = bLock ? 2 : -1;
		api.SendMessage(Ctrl.hwnd, TCM_SETITEM, i, tcItem.P);
		Resize();
	});
}
