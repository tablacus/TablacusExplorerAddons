if (window.Addon == 1) {
	Addons.CheckBox =
	{
		tid: {},
		pt: api.Memory("POINT"),
		bCtrl: false,
		FWF: WINVER < 0x600 || GetAddonOptionEx("checkbox", "XP") ? FWF_CHECKSELECT : FWF_AUTOCHECKSELECT,
		All: GetAddonOptionEx("checkbox", "All"),
		Background: GetAddonOptionEx("checkbox", "Background"),

		Init: function (Ctrl)
		{
			var fFlags = Ctrl.FolderFlags;
			if ((fFlags & (FWF_CHECKSELECT | FWF_AUTOCHECKSELECT)) != Addons.CheckBox.FWF) {
				Ctrl.FolderFlags = fFlags & (~(FWF_CHECKSELECT | FWF_AUTOCHECKSELECT)) | Addons.CheckBox.FWF;
			}
		},

		Arrange: function (Id)
		{
			Addons.CheckBox.tid[Id] = null;
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				Addons.CheckBox.tid[Id] = setTimeout("Addons.CheckBox.Arrange(" + Id + ")", 99);
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
			Addons.CheckBox.tid[Ctrl.Id] = null;
		},

		SetCtrl: function (bCtrl)
		{
			var KeyState = api.Memory("KEYSTATE");
			api.GetKeyboardState(KeyState);
			KeyState.Write(VK_CONTROL, VT_UI1, bCtrl ? 0x80 : 0);
			api.SetKeyboardState(KeyState);
			Addons.CheckBox.bCtrl = bCtrl;
		}
	};

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo)
	{
		if (Ctrl.Type != CTRL_SB) {
			return;
		}
		if (msg == WM_LBUTTONDOWN) {
			Addons.CheckBox.pt = pt.Clone();
			var ptc = pt.Clone();
			api.ScreenToClient(Ctrl.hwndList, ptc);
			var ht = api.Memory("LVHITTESTINFO");
			ht.pt = ptc;
			api.SendMessage(Ctrl.hwndList, LVM_HITTEST, 0, ht);
			Addons.CheckBox.state = ht.iItem >= 0 ? api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, ht.iItem, LVIS_STATEIMAGEMASK) : 0;
			if (Addons.CheckBox.All && Ctrl.ItemCount(SVGIO_SELECTION) > 1) {
				if (Addons.CheckBox.Background || ht.flags & (LVHT_ONITEMICON | LVHT_ONITEMLABEL)) {
					for (var i = VK_RBUTTON; i <= VK_MENU; i++) {
						if (api.GetKeyState(i) < 0) {
							return;
						}
					}
					Addons.CheckBox.SetCtrl(true);
				}
			}
			return;
		}
		if (msg == WM_LBUTTONUP) {
			if (Addons.CheckBox.bCtrl) {
				Addons.CheckBox.SetCtrl(false);
			}
			if (!IsDrag(pt, Addons.CheckBox.pt)) {
				Addons.CheckBox.pt.x = MAXINT;
				var ht = api.Memory("LVHITTESTINFO");
				var ptc = pt.Clone();
				api.ScreenToClient(Ctrl.hwndList, ptc);
				ht.pt = ptc;
				api.SendMessage(Ctrl.hwndList, LVM_HITTEST, 0, ht);
				if (ht.iItem >= 0 && ht.flags & LVHT_ABOVE) {
					var item = api.Memory("LVITEM");
					item.stateMask = LVIS_SELECTED | LVIS_STATEIMAGEMASK;
					item.state = api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, ht.iItem, LVIS_SELECTED) ? 0x1000 : LVIS_SELECTED | 0x2000;Ctrl.SelectItem(ht.iItem, SVSI_FOCUSED | (Boolean(Addons.CheckBox.FWF & FWF_CHECKSELECT) ^ Boolean(item.state & LVIS_SELECTED) ? SVSI_DESELECT : SVSI_SELECT));
					api.SendMessage(Ctrl.hwndList, 0x1000 + 67, 0, ht.iItem);
					clearTimeout(Addons.CheckBox.tid[Ctrl.Id]);
					Addons.CheckBox.tid[Ctrl.Id] = setTimeout("Addons.CheckBox.Arrange(" + Ctrl.Id + ")", 99);
				}
			}
		}
		if (msg == WM_MOUSEMOVE) {
			if (Addons.CheckBox.bCtrl) {
				Addons.CheckBox.SetCtrl(false);
			}
		}
	});

	AddEvent("SelectionChanged", function (Ctrl, uChange)
	{
		if (Ctrl.Type <= CTRL_EB) {
			clearTimeout(Addons.CheckBox.tid[Ctrl.Id]);
			Addons.CheckBox.tid[Ctrl.Id] = setTimeout("Addons.CheckBox.Arrange(" + Ctrl.Id + ")", 99);
		}
	});

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		Addons.CheckBox.Init(Ctrl);
		return S_OK;
	});

	AddEventEx(window, "load", function ()
	{
		var cFV = te.Ctrls(CTRL_FV);
		for (i in cFV) {
			Addons.CheckBox.Init(cFV[i]);
		}
		te.Data.View_fFlags &= ~(FWF_CHECKSELECT | FWF_AUTOCHECKSELECT);
		te.Data.View_fFlags |= Addons.CheckBox.FWF;
	});

	AddEvent("AddonDisabled", function (Id)
	{
		if (Id.toLowerCase() == "checkbox") {
			AddEventEx(window, "beforeunload", function ()
			{
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
		}
	});
} else {
	SetTabContents(0, "General", '<input type="checkbox" id="All" /><label for="All">All</label> (<input type="checkbox" id="Background" /><label for="Background">Background</label>)<br /><input type="checkbox" id="XP" /><label for="XP">XP ' + (GetText("Style").toLowerCase()) + '</label>');
}
