if (window.Addon == 1) {
	AddEvent("NavigateComplete", async function (Ctrl) {
		api.SendMessage(await Ctrl.hwndList, LVM_SETEXTENDEDLISTVIEWSTYLE, LVS_EX_GRIDLINES, LVS_EX_GRIDLINES);
	});

	AddEventId("AddonDisabledEx", "gridlines", async function () {
		const cFV = await te.Ctrls(CTRL_FV, false, window.chrome);
		for (let i = cFV.length; i-- > 0;) {
			const hList = await cFV[i].hwndList;
			if (hList) {
				api.SendMessage(hList, LVM_SETEXTENDEDLISTVIEWSTYLE, LVS_EX_GRIDLINES, 0);
			}
		}
	});

	const cFV = await te.Ctrls(CTRL_FV, false, window.chrome);
	for (let i = cFV.length; i-- > 0;) {
		const hList = await cFV[i].hwndList;
		if (hList) {
			api.SendMessage(hList, LVM_SETEXTENDEDLISTVIEWSTYLE, LVS_EX_GRIDLINES, LVS_EX_GRIDLINES);
		}
	}
}
