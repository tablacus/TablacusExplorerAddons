Common.SyncSelect = api.CreateObject("Object");
Common.SyncSelect.Ext = true;

Sync.SyncSelect = {
	NextTC: function (Ctrl) {
		const cTC = te.Ctrls(CTRL_TC, true);
		const TC = te.Ctrl(CTRL_TC);
		let nId = TC.Id;
		const nLen = cTC.length;
		let ix = [];
		for (let i = nLen; i--;) {
			ix.push(i);
		}
		ix = ix.sort(function (a, b) {
			return Sync.SyncSelect.Compare(cTC[a], cTC[b]);
		});
		for (let i = nLen; i--;) {
			if (cTC[ix[i]].Id == nId) {
				nId = i;
				break;
			}
		}
		return cTC[ix[(nId + 1) % nLen]];
	},

	Compare: function(TCa, TCb) {
		const rca = api.Memory("RECT");
		const rcb = api.Memory("RECT");
		api.GetWindowRect(TCa.hwnd, rca);
		api.GetWindowRect(TCb.hwnd, rcb);
		return rca.top - rcb.top || rca.left - rcb.left;
	},

	CompareDate: function (ItemA, ItemB) {
		const d = new Date(ItemA.ModifyDate).getTime() - new Date(ItemB.ModifyDate).getTime();
		return Math.abs(d) > 2000 ? d : 0;
	},

	GetFV: function (b) {
		const TCa = te.Ctrl(CTRL_TC);
		const TCb = Sync.SyncSelect.NextTC();
		if (TCa.Id != TCb.id) {
			const l = Sync.SyncSelect.Compare(TCa, TCb);
			return (b ? l >= 0 : l < 0) ? TCa.Selected : TCb.Selected;
		}
		return b ? TCa[(TCa.SelectedIndex + 1) % TCa.Count] : TCa.Selected;
	},

	GetName: function (Item) {
		const s = GetFileName(Item.Path).toLowerCase();
		return Common.SyncSelect.Ext ? s : s.replace(/\.[^\.]+$/, "");
	},

	SelectFunc: function (IsB, x, fn) {
		const FVa = this.GetFV(IsB);
		const FVb = this.GetFV(!IsB);
		const db = {};
		let Items = FVb[x]();
		for (let i = Items && Items.Count; i-- > 0;) {
			const ItemB = Items.Item(i);
			db[this.GetName(ItemB)] = ItemB;
		}
		Items = FVa.Items();
		const nCount = Items && Items.Count;
		FVa.SelectItem(null, SVSI_DESELECTOTHERS);
		for (let i = 0; i < nCount; ++i) {
			const ItemA = Items.Item(i);
			if (fn(ItemA, db[this.GetName(ItemA)])) {
				FVa.SelectItem(ItemA, SVSI_SELECT);
			}
		}
	},

	SelectMatches: function (b) {
		this.SelectFunc(b, "Items", function (ItemA, ItemB) {
			return ItemB;
		});
	},

	SelectUniques: function (b) {
		this.SelectFunc(b, "Items", function (ItemA, ItemB) {
			return !ItemB;
		});
	},

	SelectNewer: function (b) {
		this.SelectFunc(b, "Items", function (ItemA, ItemB) {
			if (IsFolderEx(ItemA) || IsFolderEx(ItemB)) {
				return false;
			}
			return ItemB && Sync.SyncSelect.CompareDate(ItemA, ItemB) > 0;
		});
	},

	SelectDifferent: function (b) {
		this.SelectFunc(b, "Items", function (ItemA, ItemB) {
			if (IsFolderEx(ItemA) || IsFolderEx(ItemB)) {
				return false;
			}
			return ItemB && (Sync.SyncSelect.CompareDate(ItemA, ItemB) || ItemA.ExtendedProperty("Size") != ItemB.ExtendedProperty("Size"));
		});
	},

	SelectUniquesNewer: function (b) {
		this.SelectFunc(b, "Items", function (ItemA, ItemB) {
			if (IsFolderEx(ItemA) || IsFolderEx(ItemB)) {
				return false;
			}
			return !ItemB || Sync.SyncSelect.CompareDate(ItemA, ItemB) > 0;
		});
	},

	SelectUniquesDifferent: function (b) {
		this.SelectFunc(b, "Items", function (ItemA, ItemB) {
			if (IsFolderEx(ItemA) || IsFolderEx(ItemB)) {
				return false;
			}
			return !ItemB || Sync.SyncSelect.CompareDate(ItemA, ItemB) || ItemA.ExtendedProperty("Size") != ItemB.ExtendedProperty("Size");
		});
	},

	SelectSelected: function (b) {
		this.SelectFunc(b, "SelectedItems", function (ItemA, ItemB) {
			return ItemB;
		});
	}
}
