const Addon_Id = "tabposition";
const item = GetAddonElement(Addon_Id);

Sync.TabPositon = {
	nNew: GetNum(item.getAttribute("NewTab")),
	nClose: GetNum(item.getAttribute("Close"))
};

AddEvent("Close", function (Ctrl) {
	let FV;
	if (Ctrl.Type <= CTRL_EB) {
		const TC = Ctrl.Parent;
		let nIndex = TC.SelectedIndex;
		if (nIndex == Ctrl.Index) {
			switch (Sync.TabPositon.nClose) {
				case 0:
					let nActive = MAXINT;
					for (let i = TC.Count; i-- > 0;) {
						FV = TC[i];
						if (FV && FV.Data && FV.Data.nActive) {
							if (FV.Data.nActive < nActive) {
								nActive = FV.Data.nActive;
								nIndex = i;
							}
						}
					}
					break;
				case 1:
					let Done = false;
					let Parent = Ctrl;
					do {
						Parent = api.ILGetParent(Parent);
						for (let i in TC) {
							FV = TC[i];
							if (FV && api.ILIsEqual(FV, Parent)) {
								nIndex = i;
								Done = true;
								break;
							}
						}
					} while (!Done && !api.ILIsEmpty(Parent));
					break;
				case 2:
					return;
				case 3:
					if (nIndex > 0) {
						nIndex--;
					}
					break;
				case 4:
					nIndex = TC.Count - 1;
					break;
				case 5:
					nIndex = 0;
					break;
			}
			if (nIndex && TC.SelectedIndex.Index <= nIndex) {
				nIndex--;
			}
			TC.SelectedIndex = nIndex;
		}
	}
});

AddEvent("SelectionChanged", function (Ctrl, uChange) {
	let FV, nMove = -1;
	if (Ctrl.Type == CTRL_TC) {
		for (let i = Ctrl.Count; i-- > 0;) {
			FV = Ctrl[i];
			if (FV && FV.Data) {
				FV.Data.nActive = (FV.Data.nActive || 0) + 1;
				if (FV.Data.Created) {
					delete FV.Data.Created;
					if (Sync.TabPositon.nNew && !g_.LockUpdate) {
						nMove = i;
					}
				}
			}
		}
		FV = Ctrl.Selected;
		if (FV && FV.Data) {
			FV.Data.nActive = 0;
		}
		if (nMove >= 0) {
			Ctrl.Move(nMove, Sync.TabPositon.nNew == 1 ? Ctrl.Count - 1 : Math.max(nMove - 1, 0));
		}
	}
});

AddEvent("Create", function (Ctrl) {
	if (Ctrl.Type <= CTRL_EB && !g_.LockUpdate) {
		Ctrl.Data.Created = true;
	}
});
