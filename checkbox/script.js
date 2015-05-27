if (window.Addon == 1) {
	Addons.CheckBox =
	{
		tid: {},
		pt: null,

		Init: function (Ctrl)
		{
			var fFlags = Ctrl.FolderFlags;
			if (!(fFlags & FWF_CHECKSELECT)) {
				Ctrl.FolderFlags = fFlags | FWF_CHECKSELECT;
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
		}
	};

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo)
	{
		if (Ctrl.Type > CTRL_EB) {
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
			if (Ctrl.ItemCount(SVGIO_SELECTION) > 1 && api.GetKeyState(VK_CONTROL) >= 0) {
				api.SendMessage(Ctrl.hwndList, WM_LBUTTONDOWN, MK_LBUTTON | MK_CONTROL, ptc.x + ptc.y * 0x10000);
				return S_OK;
			}
			return;
		}
		if (msg == WM_LBUTTONUP) {
		 	if (!IsDrag(pt, Addons.CheckBox.pt)) {
				var ht = api.Memory("LVHITTESTINFO");
				var ptc = pt.Clone();
				api.ScreenToClient(Ctrl.hwndList, ptc);
				ht.pt = ptc;
				api.SendMessage(Ctrl.hwndList, LVM_HITTEST, 0, ht);
				if (ht.iItem >= 0 && ht.flags & LVHT_ABOVE) {
					var item = api.Memory("LVITEM");
					item.stateMask = LVIS_SELECTED | LVIS_STATEIMAGEMASK;
					item.state = api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, ht.iItem, LVIS_SELECTED) ? 0x1000 : LVIS_SELECTED | 0x2000;
					api.SendMessage(Ctrl.hwndList, LVM_SETITEMSTATE, ht.iItem, item);
				}
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
		te.Data.View_fFlags |= FWF_CHECKSELECT;
	});

	AddEvent("AddonDisabled", function (Id)
	{
		if (api.strcmpi(Id, "checkbox") == 0) {
			AddEventEx(window, "beforeunload", function ()
			{
				var cFV = te.Ctrls(CTRL_FV);
				for (i in cFV) {
					var FV = cFV[i];
					var fFlags = FV.FolderFlags;
					if (fFlags & FWF_CHECKSELECT) {
						FV.FolderFlags = fFlags & ~FWF_CHECKSELECT;
					}
				}
				te.Data.View_fFlags &= ~FWF_CHECKSELECT;
			});
		}
	});
}
