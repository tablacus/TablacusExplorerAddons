const Addon_Id = "sidetreeview";
const item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("List", 1);
}
if (window.Addon == 1) {
	Addons.SideTreeView = {
		Align: GetNum(item.getAttribute("Align")) ? "Right" : "Left",
		List: item.getAttribute("List"),
		Depth: GetNum(item.getAttribute("Depth")),
		Collapse: GetNum(item.getAttribute("Collapse")),
		Height: item.getAttribute("Height") || '100%',
		Root: item.text || item.textContent || item.getAttribute("Root"),
		tid: {},

		Init: async function () {
			if (!await te.Data["Conf_" + this.Align + "BarWidth"]) {
				te.Data["Conf_" + this.Align + "BarWidth"] = 178;
			}
			let h = Addons.SideTreeView.Height;
			if (h == Number(h)) {
				h += 'px';
			}
			SetAddon(Addon_Id, this.Align + "Bar2", ['<div id="sidetreeview" style="width: 100%; height: ', EncodeSC(h), '"></div>']);
			if (await te.Ctrls(CTRL_FV).Count) {
				this.Create();
			}
		},

		Create: async function () {
			Common.SideTreeView = await api.CreateObject("Object");
			Common.SideTreeView.TV = await te.CreateCtrl(CTRL_TV);
			Common.SideTreeView.TV.Style = await te.Data.Tree_Style;
			Common.SideTreeView.TV.SetRoot(Addons.SideTreeView.Root || await te.Data.Tree_Root, await te.Data.Tree_EnumFlags, await te.Data.Tree_RootStyle);

			if (Addons.SideTreeView.List) {
				AddEvent("ChangeView", Addons.SideTreeView.Expand);
			}

			AddEvent("Resize", Addons.SideTreeView.Resize);

			AddEvent("FullscreenChanged", function (bFullscreen) {
				Common.SideTreeView.TV.Visible = !bFullscreen;
			});

			AddEvent("Finalize", function () {
				Common.SideTreeView.TV.Close();
			});
		},

		Expand: function () {
			if (Addons.SideTreeView.List) {
				Sync.SideTreeView.Expand(Addons.SideTreeView.Depth, Addons.SideTreeView.Collapse);
			}
		},

		Resize: async function () {
			const TV = await Common.SideTreeView.TV;
			const hwnd = TV && await TV.hwnd;
			const o = document.getElementById("sidetreeview");
			if (o && TV && await api.IsWindowVisible(hwnd)) {
				const pt = GetPos(o);
				api.MoveWindow(hwnd, pt.x, pt.y, o.offsetWidth, o.offsetHeight, true);
				api.RedrawWindow(hwnd, null, 0, RDW_INVALIDATE | RDW_ERASE | RDW_FRAME | RDW_ALLCHILDREN);
				api.BringWindowToTop(hwnd);
				Addons.SideTreeView.Expand();
			} else {
				if (TV) {
					TV.Visible = true;
				}
				setTimeout(Addons.SideTreeView.Resize, 999);
			}
		}
	};

	AddEvent("Load", async function () {
		Addons.SideTreeView.Init();
		if (WINVER >= 0x600) {
			$.importScript("addons\\" + Addon_Id + "\\sync.js");
		}
		if (Addons.TreeView) {
			return;
		}

		if (Addons.SideTreeView.List) {
			SetGestureExec("Tree", "1", async function (Ctrl, pt) {
				let Item = await Ctrl.HitTest(pt);
				if (Item && (await Item.Enum || await Item.IsFolder)) {
					let FV = await Ctrl.FolderView;
					if (!await api.ILIsEqual(await FV.FolderItem, Item)) {
						setTimeout(async function () {
							FV.Navigate(Item, await GetNavigateFlags(FV));
						}, 99);
					}
				}
			}, "Async", true);
		}

		SetGestureExec("Tree", "11", async function (Ctrl, pt) {
			let Item = await Ctrl.HitTest(pt);
			if (Item) {
				let FV = await Ctrl.FolderView;
				if (!await api.ILIsEqual(await FV.FolderItem, Item)) {
					setTimeout(function () {
						FolderMenu.Invoke(Item, void 0, FV);
					}, 99);
				}
			}
		}, "Async", true);

		SetGestureExec("Tree", "3", async function (Ctrl, pt) {
			let Item = await Ctrl.SelectedItem;
			if (Item) {
				setTimeout(function () {
					Ctrl.FolderView.Navigate(Item, SBSP_NEWBROWSER);
				}, 99);
			}
		}, "Async", true);

		//Tab
		SetKeyExec("Tree", "$f", async function (Ctrl, pt) {
			let FV = await GetFolderView(Ctrl, pt);
			FV.Focus();
		}, "Async", true);
		//Enter
		SetKeyExec("Tree", "$1c", async function (Ctrl, pt) {
			let FV = await GetFolderView(Ctrl, pt);
			FV.Navigate(await Ctrl.SelectedItem, GetNavigateFlags(FV));
		}, "Async", true);

	});
	Addons.SideTreeView.Create();
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
