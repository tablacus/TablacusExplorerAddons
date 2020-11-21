var Addon_Id = "checkbox";
var item = GetAddonElement(Addon_Id);

Sync.CheckBox = {
	pt: api.Memory("POINT"),
	bCtrl: false,
	FWF: WINVER < 0x600 || GetNum(item.getAttribute("XP")) ? FWF_CHECKSELECT : FWF_AUTOCHECKSELECT,
	All: GetNum(item.getAttribute("All")),
	Background: GetNum(item.getAttribute("Background")),

	Init: function (Ctrl) {
		var fFlags = Ctrl.FolderFlags;
		if ((fFlags & (FWF_CHECKSELECT | FWF_AUTOCHECKSELECT)) != Sync.CheckBox.FWF) {
			Ctrl.FolderFlags = fFlags & (~(FWF_CHECKSELECT | FWF_AUTOCHECKSELECT)) | Sync.CheckBox.FWF;
		}
	},

	Arrange: function (Id) {
		if (api.GetKeyState(VK_LBUTTON) < 0) {
			InvokeUI("Addons.CheckBox.Set", Id);
			return;
		}
		var Ctrl = te.Ctrl(CTRL_FV, Id);
		var item = api.Memory("LVITEM");
		item.stateMask = LVIS_SELECTED | LVIS_STATEIMAGEMASK;
		var nCount = Ctrl.ItemCount(SVGIO_ALLVIEW);

		for (var i = nCount; i-- > 0;) {
			item.state = api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, i, LVIS_SELECTED) ? LVIS_SELECTED | 0x2000 : 0x1000;
			api.SendMessage(Ctrl.hwndList, LVM_SETITEMSTATE, i, item);
		}
		api.SendMessage(Ctrl.hwndList, LVM_REDRAWITEMS, 0, nCount - 1);
	},

	SetCtrl: function (bCtrl) {
		var KeyState = api.Memory("KEYSTATE");
		api.GetKeyboardState(KeyState);
		KeyState.Write(VK_CONTROL, VT_UI1, bCtrl ? 0x80 : 0);
		api.SetKeyboardState(KeyState);
		Sync.CheckBox.bCtrl = bCtrl;
	}
};

AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo) {
	if (Ctrl.Type != CTRL_SB) {
		return;
	}
	if (msg == WM_LBUTTONDOWN) {
		Sync.CheckBox.pt = pt.Clone();
		var ptc = pt.Clone();
		api.ScreenToClient(Ctrl.hwndList, ptc);
		var ht = api.Memory("LVHITTESTINFO");
		ht.pt = ptc;
		api.SendMessage(Ctrl.hwndList, LVM_HITTEST, 0, ht);
		Sync.CheckBox.state = ht.iItem >= 0 ? api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, ht.iItem, LVIS_STATEIMAGEMASK) : 0;
		if (Sync.CheckBox.All && Ctrl.ItemCount(SVGIO_SELECTION) > 1) {
			if (Sync.CheckBox.Background || ht.flags & (LVHT_ONITEMICON | LVHT_ONITEMLABEL)) {
				for (var i = VK_RBUTTON; i <= VK_MENU; i++) {
					if (api.GetKeyState(i) < 0) {
						return;
					}
				}
				Sync.CheckBox.SetCtrl(true);
			}
		}
		return;
	}
	if (msg == WM_LBUTTONUP) {
		if (Sync.CheckBox.bCtrl) {
			Sync.CheckBox.SetCtrl(false);
		}
		if (!IsDrag(pt, Sync.CheckBox.pt)) {
			Sync.CheckBox.pt.x = MAXINT;
			var ht = api.Memory("LVHITTESTINFO");
			var ptc = pt.Clone();
			api.ScreenToClient(Ctrl.hwndList, ptc);
			ht.pt = ptc;
			api.SendMessage(Ctrl.hwndList, LVM_HITTEST, 0, ht);
			if (ht.iItem >= 0 && ht.flags & LVHT_ABOVE) {
				var item = api.Memory("LVITEM");
				item.stateMask = LVIS_SELECTED | LVIS_STATEIMAGEMASK;
				item.state = api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, ht.iItem, LVIS_SELECTED) ? 0x1000 : LVIS_SELECTED | 0x2000; Ctrl.SelectItem(ht.iItem, SVSI_FOCUSED | (Boolean(Sync.CheckBox.FWF & FWF_CHECKSELECT) ^ Boolean(item.state & LVIS_SELECTED) ? SVSI_DESELECT : SVSI_SELECT));
				api.SendMessage(Ctrl.hwndList, 0x1000 + 67, 0, ht.iItem);
				InvokeUI("Addons.CheckBox.Set", Ctrl.Id);
			}
		}
	}
	if (msg == WM_MOUSEMOVE) {
		if (Sync.CheckBox.bCtrl) {
			Sync.CheckBox.SetCtrl(false);
		}
	}
});

AddEvent("SelectionChanged", function (Ctrl, uChange) {
	if (Ctrl.Type <= CTRL_EB) {
		InvokeUI("Addons.CheckBox.Set", Ctrl.Id);
	}
});

AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
	Sync.CheckBox.Init(Ctrl);
	return S_OK;
});

AddEvent("BeginLabelEdit", function (Ctrl, Name) {
	if (Ctrl.Type == CTRL_SB) {
		if (Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
			setTimeout(function (FV, Item) {
				if (Ctrl.ItemCount(SVGIO_SELECTION) > 1) {
					FV.SelectItem(Item, SVSI_SELECT | SVSI_DESELECTOTHERS);
				}
			}, 99, Ctrl, Ctrl.SelectedItems().Item(0));
		}
	}
}, true);

AddEvent("Load", function () {
	var cFV = te.Ctrls(CTRL_FV);
	for (i in cFV) {
		Sync.CheckBox.Init(cFV[i]);
	}
	te.Data.View_fFlags &= ~(FWF_CHECKSELECT | FWF_AUTOCHECKSELECT);
	te.Data.View_fFlags |= Sync.CheckBox.FWF;
});

AddEventId("AddonDisabledEx", Addon_Id, function () {
	var cFV = te.Ctrls(CTRL_FV);
	for (i in cFV) {
		var FV = cFV[i];
		var fFlags = FV.FolderFlags;
		if (fFlags & (FWF_CHECKSELECT | FWF_AUTOCHECKSELECT)) {
			FV.FolderFlags = fFlags & ~(FWF_CHECKSELECT | FWF_AUTOCHECKSELECT);
		}
	}
	te.Data.View_fFlags &= ~(FWF_CHECKSELECT | FWF_AUTOCHECKSELECT);
});
