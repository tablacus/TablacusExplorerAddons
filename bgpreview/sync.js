const Addon_Id = "bgpreview";
const item = GetAddonElement(Addon_Id);

Sync.BGPreview = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),
	Extract: GetNum(item.getAttribute("IsExtract")) ? item.getAttribute("Extract") || "*" : "-",
	Size: GetNum(item.getAttribute("Size")) || 256,
	Visible: !GetNum(item.getAttribute("Hidden")),
	Alpha: GetNum(item.getAttribute("Alpha")) || 100,
	Limits: GetNum(item.getAttribute("Limits")) || 10000000,
	Items: {},

	Exec: function (Ctrl, pt) {
		Sync.BGPreview.Visible = !Sync.BGPreview.Visible;
		if (Sync.BGPreview.Visible) {
			Sync.BGPreview.Arrange();
		} else {
			Sync.BGPreview.Clear();
		}
	},

	Arrange: function (FV, Item) {
		if (!FV) {
			FV = te.Ctrl(CTRL_FV);
		}
		if (!Item && FV.ItemCount(SVGIO_SELECTION) > 0) {
			Item = FV.SelectedItems().Item(0);
		}
		const hwnd = FV.hwndList;
		if (!Item) {
			Sync.BGPreview.SetImage(hwnd, LVBKIF_TYPE_WATERMARK, null);
			return;
		}
		if (Sync.BGPreview.Visible && hwnd) {
			if (api.UQuadCmp(Item.ExtendedProperty("Size"), Sync.BGPreview.Limits) > 0) {
				return;
			}
			if (api.ILIsEqual(Item, Sync.BGPreview.Items[hwnd])) {
				return;
			}
			const bClear = Sync.BGPreview.Items[hwnd] === null;
			Sync.BGPreview.Items[hwnd] = Item;
			Threads.GetImage({
				FV: FV,
				hwnd: hwnd,
				path: Item,
				cx: Sync.BGPreview.Size,
				f: true,
				Items: Sync.BGPreview.Items,
				Extract: Sync.BGPreview.Extract,
				SetImage: Sync.BGPreview.SetImage,
				bClear: bClear,
				type: -2,
				mix: Sync.BGPreview.Alpha,

				onload: function (o) {
					if (o.path === o.Items[o.hwnd]) {
						o.Items[o.hwnd] = null;
						o.SetImage(o.hwnd, LVBKIF_TYPE_WATERMARK | LVBKIF_FLAG_ALPHABLEND, o.out);
					}
				},
				onerror: function (o) {
					if (o.Items[o.hwnd]) {
						if (o.bClear) {
							o.SetImage(o.hwnd, LVBKIF_TYPE_WATERMARK, null);
						}
						if (!IsFolderEx(o.path) && api.PathMatchSpec(o.path.Path, o.Extract)) {
							const Items = api.CreateObject("FolderItems");
							Items.AddItem(o.path);
							te.OnBeforeGetData(o.FV, Items, 11);
							if (IsExists(o.path.Path)) {
								o.onerror = null;
								MainWindow.Threads.GetImage(o);
							}
						}
					}
				}
			});
		}
	},

	SetImage: function (hwnd, ulFlags, hbm) {
		Sync.BGPreview.ClearImage(hwnd);
		const lvbk = api.Memory("LVBKIMAGE");
		lvbk.ulFlags = ulFlags;
		lvbk.hbm = hbm;
		if (!api.SendMessage(hwnd, LVM_SETBKIMAGE, 0, lvbk)) {
			if (hbm) {
				api.DeleteObject(hbm);
			}
		}
	},

	ClearImage: function (hwnd) {
		const lvbk = api.Memory("LVBKIMAGE");
		lvbk.ulFlags = LVBKIF_TYPE_WATERMARK;
		if (api.SendMessage(hwnd, LVM_GETBKIMAGE, 0, lvbk)) {
			if (lvbk.hbm) {
				api.DeleteObject(lvbk.hbm);
			}
		}
	},

	Unload: function (Ctrl, fs, wFlags, Prev) {
		const hwnd = Ctrl.hwndList;
		if (hwnd) {
			Sync.BGPreview.ClearImage(hwnd);
		}
	},

	Clear: function () {
		for (let hwnd in Sync.BGPreview.Items) {
			if (Sync.BGPreview.Items[hwnd] === null) {
				Sync.BGPreview.SetImage(hwnd, LVBKIF_TYPE_WATERMARK, null);
			}
			delete Sync.BGPreview.Items[hwnd];
		}
	}
};

AddEvent("StatusText", function (Ctrl, Text, iPart) {
	if (Ctrl.Path) {
		Sync.BGPreview.Arrange(null, Ctrl);
	} else if (Ctrl.Type <= CTRL_EB && Text) {
		Sync.BGPreview.Arrange(Ctrl);
	}
});

if (!item.getAttribute("NoMouse")) {
	AddEvent("ToolTip", function (Ctrl, Index) {
		if (Ctrl.Type == CTRL_SB && Index >= 0) {
			const Item = Ctrl.Item(Index);
			if (Item) {
				Sync.BGPreview.Arrange(Ctrl, Item);
			}
		}
	}, true);
}

AddEvent("BeforeNavigate", Sync.BGPreview.Unload, true);

AddEventId("AddonDisabledEx", "bgpreview", Sync.BGPreview.Clear);

AddEvent("Finalize", Sync.BGPreview.Clear);

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.BGPreview.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.BGPreview.strName);
		ExtraMenuCommand[nPos] = Sync.BGPreview.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.BGPreview.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.BGPreview.Exec, "Func");
}

AddTypeEx("Add-ons", "Preview in background", Sync.BGPreview.Exec);
