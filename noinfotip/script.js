if (window.Addon == 1) {
	Addons.NoInfotip =
	{
		SetList: function (Ctrl)
		{
			api.SendMessage(Ctrl.hwndList, LVM_SETEXTENDEDLISTVIEWSTYLE, LVS_EX_INFOTIP, 0);
		},
		
		SetAll: function(dw)
		{
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				var FV = cFV[i];
				if (FV.hwndList) {
					api.SendMessage(FV.hwndList, LVM_SETEXTENDEDLISTVIEWSTYLE, LVS_EX_INFOTIP, dw);
				}
			}
		}
	};

	AddEvent("ViewCreated", Addons.NoInfotip.SetList);

	AddEventId("AddonDisabledEx", "noinfotip", function ()
	{
		Addons.NoInfotip.SetAll(LVM_SETEXTENDEDLISTVIEWSTYLE);
	});

	Addons.NoInfotip.SetAll(0);
}
