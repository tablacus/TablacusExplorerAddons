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
		}
	};

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo)
	{
		if (msg == WM_LBUTTONDOWN) {
			Addons.CheckBox.pt = pt;
		}
		if (msg == WM_LBUTTONUP && !IsDrag(pt, Addons.CheckBox.pt)) {
			if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
				var ht = api.Memory("LVHITTESTINFO");
				var ptc = pt.Clone();
				api.ScreenToClient(Ctrl.hwndList, ptc);
				ht.pt = ptc;
				api.SendMessage(Ctrl.hwndList, LVM_HITTEST, 0, ht);
				if (ht.flags & LVHT_ABOVE && ht.iItem >= 0) {
					var item = api.Memory("LVITEM");
					item.stateMask = LVIS_SELECTED | LVIS_STATEIMAGEMASK;
					item.state = api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, ht.iItem, LVIS_SELECTED) ? 0x1000 : LVIS_SELECTED | 0x2000;
					api.SendMessage(Ctrl.hwndList, LVM_SETITEMSTATE, ht.iItem, item);
					api.SendMessage(Ctrl.hwndList, LVM_REDRAWITEMS, ht.iItem, ht.iItem);
				}
			}
		}
	});

	AddEvent("SelectionChanged", function (Ctrl, uChange)
	{
		if (Ctrl.Type <= CTRL_EB) {
			clearTimeout(Addons.CheckBox.tid[Ctrl.Id]);
			Addons.CheckBox.tid[Ctrl.Id] = setTimeout(function ()
			{
				var Items = Ctrl.Items();
				var item = api.Memory("LVITEM");
				item.stateMask = LVIS_SELECTED | LVIS_STATEIMAGEMASK;
				for (var i = Items.Count; i-- > 0;) {
					item.state = api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, i, LVIS_SELECTED) ? LVIS_SELECTED | 0x2000 : 0x1000;
					api.SendMessage(Ctrl.hwndList, LVM_SETITEMSTATE, i, item);
				}
				api.SendMessage(Ctrl.hwndList, LVM_REDRAWITEMS, 0, Items.Count - 1);
				Addons.CheckBox.tid[Ctrl.Id] = null;
			}, 500);
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
		te.Data.View_fFlags |= ~FWF_CHECKSELECT;
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
