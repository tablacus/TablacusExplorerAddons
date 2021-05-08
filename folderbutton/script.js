const Addon_Id = "folderbutton";
const Default = "ToolBar2Left";
let item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.FolderButton = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
		IconSize: GetIconSizeEx(item),

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				InputDialog("Path", await api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), async function (r) {
					if (r) {
						FV.Navigate(r, await GetNavigateFlags(FV));
					}
				});
			}
		},

		Popup: async function (o) {
			const FV = await GetFolderView(o);
			if (FV) {
				FV.Focus();
				const pt = GetPos(o, 9);
				const FolderItem = await FolderMenu.Open(FV.FolderItem, pt.x, pt.y);
				FolderMenu.Invoke(FolderItem);
			}
		},

		Drag: async function (ev) {
			const FV = await GetFolderView(ev);
			FV.Focus();
			const TC = await FV.Parent;
			if (TC) {
				const nSelectedIndex = await TC.SelectedIndex;
				if (nSelectedIndex >= 0) {
					te.Data.DragTab = TC;
					te.Data.DragIndex = nSelectedIndex;
					const DataObj = await api.CreateObject("FolderItems");
					DataObj.AddItem(await TC[nSelectedIndex]);
					DataObj.dwEffect = DROPEFFECT_LINK;
					DoDragDrop(DataObj, DROPEFFECT_LINK | DROPEFFECT_COPY | DROPEFFECT_MOVE, false, function () {
						te.Data.DragTab = null;
					});
				}
			}
		},

		ChangeIcon: async function (Ctrl, o) {
			o.innerHTML = await GetImgTag({
				title: Addons.FolderButton.sName,
				src: await GetIconImage(Ctrl, CLR_DEFAULT | COLOR_BTNFACE),
			}, Addons.FolderButton.IconSize);
		}
	};

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("FolderButton", Addons.FolderButton.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.FolderButton.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.FolderButton.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		let s = item.getAttribute("Icon");
		if (!s) {
			s = "folder:closed";
			AddEvent("ChangeView2", async function (Ctrl) {
				const Id = await Ctrl.Parent.Id;
				let o = document.getElementById("FolderButton_$");
				if (o) {
					if (Id == await te.Ctrl(CTRL_TC).Id) {
						Addons.FolderButton.ChangeIcon(Ctrl, o);
					}
				} else if (o = document.getElementById("FolderButton_" + Id)) {
					Addons.FolderButton.ChangeIcon(Ctrl, o);
				}
			});
		}
		await SetAddon(Addon_Id, Default, ['<span id="FolderButton_$" class="button" onclick="Addons.FolderButton.Exec(this)" oncontextmenu="return Addons.FolderButton.Popup(this); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut();" ondragstart="Addons.FolderButton.Drag(event); return false" draggable="true">', await GetImgTag({
			title: Addons.FolderButton.sName,
			src: s,
		}, Addons.FolderButton.IconSize), '</span>']);
		delete item;
	});

	AddTypeEx("Add-ons", "Folder button", Addons.FolderButton.Exec);
} else {
	EnableInner();
}
