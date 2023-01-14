Sync.InnerSyncSelect = {
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
			return Sync.InnerSyncSelect.Compare(cTC[a], cTC[b]);
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

	GetFV: function (b) {
		const TCa = te.Ctrl(CTRL_TC);
		const TCb = Sync.InnerSyncSelect.NextTC();
		if (TCa.Id != TCb.id) {
			const l = Sync.InnerSyncSelect.Compare(TCa, TCb);
			return (b ? l >= 0 : l < 0) ? TCa.Selected : TCb.Selected;
		}
		return b ? TCa[(TCa.SelectedIndex + 1) % TCa.Count] : TCa.Selected;
	},

	GetName: function (Item) {
		const s = GetFileName(Item.Path).toLowerCase();
		return MainWindow.Common.InnerSyncSelect.NoExt ? s.replace(/\.[^\.]+$/, "") : s;
	},

	GetSize: function (FV, Item) {
		const wfd = api.Memory("WIN32_FIND_DATA");
		api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size);
		if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
			++this.nAll;
			const n = FV.TotalFileSize[api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_ORIGINAL)];
			if (n == null) {
				FV.Notify(0, Item, null, 1);
				++this.nRetry;
			} else if (n === "") {
				++this.nRetry;
			}
			return n;
		}
		return Item.ExtendedProperty("Size");
	},

	CompareDate: function (ItemA, ItemB) {
		const d = new Date(ItemA.ModifyDate).getTime() - new Date(ItemB.ModifyDate).getTime();
		return Math.abs(d) > 2000 ? d : 0;
	},

	SelectFunc: function (name, IsB, x, fn) {
		InvokeUI("Addons.InnerSyncSelect.Clear");
		this.nAll = 0;
		this.nRetry = 0;
		const FVa = this.GetFV(IsB);
		const FVb = this.GetFV(!IsB);
		if (FVa.Parent.Selected.Id == FVa.Id) {
			FVa.Focus();
		}
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
			if (fn(ItemA, db[this.GetName(ItemA)], FVa, FVb)) {
				FVa.SelectItem(ItemA, SVSI_SELECT);
			}
		}
		if (this.nRetry) {
			FVa.SelectItem(null, SVSI_DESELECTOTHERS);
			InvokeUI("Addons.InnerSyncSelect.Retry", [name, IsB, ((this.nAll - this.nRetry) / this.nAll * 100).toFixed(0) + "%"]);
			return;
		} else {
			InvokeUI("Addons.InnerSyncSelect.SetTitle", [GetText(name) + " : "+ FVa.FolderItem.Path]);
		}
	},

	SelectMatches: function (b) {
		Sync.InnerSyncSelect.SelectFunc("Select matches", b, "Items", function (ItemA, ItemB) {
			return ItemB;
		});
	},

	SelectUniques: function (b) {
		Sync.InnerSyncSelect.SelectFunc("Select uniques", b, "Items", function (ItemA, ItemB) {
			return !ItemB;
		});
	},

	SelectNewer: function (b) {
		Sync.InnerSyncSelect.SelectFunc("Select newer", b, "Items", function (ItemA, ItemB) {
			return ItemB && Sync.InnerSyncSelect.CompareDate(ItemA, ItemB) > 0;
		});
	},

	SelectDifferent: function (b) {
		Sync.InnerSyncSelect.SelectFunc("Select different", b, "Items", function (ItemA, ItemB, FVa, FVb) {
			return ItemB && (Sync.InnerSyncSelect.CompareDate(ItemA, ItemB) || Sync.InnerSyncSelect.GetSize(FVa, ItemA) != Sync.InnerSyncSelect.GetSize(FVb, ItemB));
		});
	},

	SelectUniquesNewer: function (b) {
		Sync.InnerSyncSelect.SelectFunc("Select uniques and newer", b, "Items", function (ItemA, ItemB) {
			return !ItemB || Sync.InnerSyncSelect.CompareDate(ItemA, ItemB) > 0;
		});
	},

	SelectUniquesDifferent: function (b) {
		Sync.InnerSyncSelect.SelectFunc("Select uniques and different", b, "Items", function (ItemA, ItemB, FVa, FVb) {
			return !ItemB || Sync.InnerSyncSelect.CompareDate(ItemA, ItemB) || Sync.InnerSyncSelect.GetSize(FVa, ItemA) != Sync.InnerSyncSelect.GetSize(FVb, ItemB);
		});
	},

	SelectSelected: function (b) {
		Sync.InnerSyncSelect.SelectFunc("Select selected", b, "SelectedItems", function (ItemA, ItemB) {
			return ItemB;
		});
	}
}
