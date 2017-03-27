if (window.Addon == 1) {
	Addons.LockedTabsTop =
	{
		tid: [],

		Exec: function (Ctrl)
		{
			var FV = GetFolderView(Ctrl);
			if (FV) {
				var TC = FV.Parent;
				if (TC) {
					if (Addons.LockedTabsTop.tid[TC.id]) {
						clearTimeout(Addons.LockedTabsTop.tid[TC.id]);
					}
					Addons.LockedTabsTop.tid[TC.id] = setTimeout(function ()
					{
						if (FV && FV.Data) {
							Addons.LockedTabsTop.Lock(TC, FV.Index, FV.Data.Lock);
							Addons.LockedTabsTop.tid[TC.id] = null;
							for (var j = TC.Count; j > 1; j--) {
								for (var i = j; i-- > 1;) {
									if ((TC[i - 1].Data.Lock ? 1 : 0) < (TC[i].Data.Lock ? 1 : 0)) {
										TC.Move(i, i - 1);
									}
								}
							}
						}
					}, 99);
				}
			}
		},

		Lock: function (Ctrl, i, bLock)
		{
			var FV = Ctrl[i];
			if (FV) {
				var TC = FV.Parent;
				if (TC) {
					if (bLock) {
						for (var j = 0; j < i; j++) {
							if (!TC[j].Data.Lock) {
								TC.Move(i, j);
								break;
							}
						}
					} else {
						for (var j = TC.Count; --j > i;) {
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
	AddEvent("BeforeNavigate", Addons.LockedTabsTop.Exec);
	AddEvent("Lock", Addons.LockedTabsTop.Lock);
	AddEvent("Create", Addons.LockedTabsTop.Exec);
	Addons.LockedTabsTop.Exec();
}
