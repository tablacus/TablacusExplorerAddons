if (window.Addon == 1) {
	Addons.FixSelection = {
		tid: {},

		Exec: async function (FV, Selected) {
			Addons.FixSelection.tid[await FV.Id] = void 0;
			const nCount = Selected && await Selected.Count;
			if (nCount != await FV.ItemCount(SVGIO_SELECTION)) {
				FV.SelectItem(Selected, SVSI_SELECT | SVSI_NOTAKEFOCUS | SVSI_DESELECTOTHERS | SVSI_SELECTIONMARK);
				FV.Data.Selected = void 0;
			}
		},

		ChangeNotify: async function (FV) {
			if (await FV.Data) {
				const Selected = await FV.Data.Selected
				const Id = await FV.Id;
				if (Selected) {
					if (Addons.FixSelection.tid[Id]) {
						clearTimeout(Addons.FixSelection.tid[Id]);
					}
					Addons.FixSelection.tid[Id] = setTimeout(function () {
						Addons.FixSelection.Exec(FV, Selected);
					}, 99);
				}
			}
		}
	}

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
		Ctrl.Data.Selected = void 0;
	});

	AddEvent("SelectionChanged", async function (Ctrl, uChange) {
		if (await Ctrl.Data && await Ctrl.SelectedItems) {
			const Selected = await Ctrl.SelectedItems();
			if (await Selected.Count == 0) {
				setTimeout(async function () {
					if (await Ctrl.Data && await Ctrl.SelectedItems) {
						Ctrl.Data.Selected = await Ctrl.SelectedItems();
					}
				}, 99);
				return;
			}
			Ctrl.Data.Selected = Selected;
		}
	});

	AddEvent("Sort", async function (Ctrl) {
		Addons.FixSelection.Exec(Ctrl, await Ctrl.Data.Selected);
	});

	AddEvent("Command", async function (Ctrl, hwnd, msg, wParam, lParam) {
		if (msg == WM_NULL) {
			Addons.FixSelection.ChangeNotify(await GetFolderView(Ctrl));
		}
	});

	AddEvent("ChangeNotify", async function (Ctrl, pidls, wParam, lParam) {
		const cFV = await te.Ctrls(CTRL_FV, false, window.chrome);
		for (let i = cFV.length; i-- > 0;) {
			Addons.FixSelection.ChangeNotify(cFV[i]);
		}
	});
}
