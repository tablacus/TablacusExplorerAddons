Sync.LockedTabsTop = {
	Exec: function (Ctrl) {
		try {
			const FV = GetFolderView(Ctrl);
			if (FV) {
				if (FV.Data) {
					const TC = FV.Parent;
					if (TC) {
						Sync.LockedTabsTop.Lock(TC, FV.Index, FV.Data.Lock);
						for (let j = TC.Count; j > 1; j--) {
							for (let i = j; i-- > 1;) {
								if ((TC[i - 1].Data.Lock ? 1 : 0) < (TC[i].Data.Lock ? 1 : 0)) {
									TC.Move(i, i - 1);
								}
							}
						}
					}
				}
			}
		} catch (e) { }
	},

	Lock: function (Ctrl, i, bLock) {
		const FV = Ctrl[i];
		if (FV) {
			const TC = FV.Parent;
			if (TC) {
				if (bLock) {
					for (let j = 0; j < i; j++) {
						if (!TC[j].Data.Lock) {
							TC.Move(i, j);
							break;
						}
					}
				} else {
					for (let j = TC.Count; --j > i;) {
						if (TC[j].Data.Lock) {
							TC.Move(i, j);
							break;
						}
					}
				}
			}
		}
	}
}
AddEvent("NavigateComplete", Sync.LockedTabsTop.Exec);
AddEvent("Lock", Sync.LockedTabsTop.Lock);
AddEvent("Create", Sync.LockedTabsTop.Exec);
Sync.LockedTabsTop.Exec();
