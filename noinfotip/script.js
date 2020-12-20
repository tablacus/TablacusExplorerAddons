if (window.Addon == 1) {
	Addons.NoInfotip = {
		SetList: async function (Ctrl) {
			const hList = await Ctrl.hwndList;
			if (hList) {
				api.SendMessage(hList, LVM_SETEXTENDEDLISTVIEWSTYLE, LVS_EX_INFOTIP, 0);
			}
		},

		SetAll: async function (dw) {
			let cFV = await te.Ctrls(CTRL_FV);
			if (window.chrome) {
				cFV = await api.CreateObject("SafeArray", cFV);
			}
			for (let i = 0; i < cFV.length; ++i) {
				const hList = await cFV[i].hwndList;
				if (hList) {
					api.SendMessage(hList, LVM_SETEXTENDEDLISTVIEWSTYLE, LVS_EX_INFOTIP, dw);
				}
			}
		}
	};

	AddEvent("ViewCreated", Addons.NoInfotip.SetList);

	AddEventId("AddonDisabledEx", "noinfotip", function () {
		Addons.NoInfotip.SetAll(LVM_SETEXTENDEDLISTVIEWSTYLE);
	});

	Addons.NoInfotip.SetAll(0);
}
