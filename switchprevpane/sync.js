Sync.SwitchPrevPane = {
	Exec: function (Ctrl) {
		const cTC = te.Ctrls(CTRL_TC, true);
		const TC = te.Ctrl(CTRL_TC);
		let nId = TC.Id;
		const nLen = cTC.length;
		let ix = [];
		for (let i = nLen; i--;) {
			ix.push(i);
		}
		ix = ix.sort(
			function (a, b) {
				const rca = api.Memory("RECT");
				const rcb = api.Memory("RECT");
				api.GetWindowRect(cTC[a].hwnd, rca);
				api.GetWindowRect(cTC[b].hwnd, rcb);
				return rca.top - rcb.top || rca.left - rcb.left;
			}
		);
		for (let i = nLen; i--;) {
			if (cTC[ix[i]].Id == nId) {
				nId = i;
				break;
			}
		}
		return cTC[ix[(nId + nLen - 1) % nLen]].Selected;
	}
}

AddEnv("PrevPane", function (Ctrl) {
	const FV = Sync.SwitchPrevPane.Exec(Ctrl);
	if (FV) {
		return PathQuoteSpaces(api.GetDisplayNameOf(FV, SHGDN_FORPARSING));
	}
});

AddTypeEx("Add-ons", "Switch to previous pane", function (Ctrl) {
	const FV = Sync.SwitchPrevPane.Exec(Ctrl);
	if (FV) {
		return FV.Focus();
	}
});
