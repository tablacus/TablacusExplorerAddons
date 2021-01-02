const Addon_Id = "folderbutton";
const Default = "ToolBar2Left";

const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.FolderButton = {
		bDrag: false,
		clBtnFace: await api.GetSysColor(COLOR_BTNFACE),

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				InputDialog("Path", await api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL), async function (r) {
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

		Button: function (b) {
			this.bDrag = b;
		},

		Drag: async function (o) {
			const FV = await GetFolderView(o);
			if (this.bDrag) {
				FV.Focus();
				this.bDrag = false;
				const TC = await te.Ctrl(CTRL_TC);
				if (TC) {
					const nSelectedIndex = await TC.SelectedIndex;
					if (nSelectedIndex >= 0) {
						var pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
						te.Data.DragTab = TC;
						te.Data.DragIndex = nSelectedIndex;
						api.SHDoDragDrop(null, await TC.Item(nSelectedIndex).FolderItem, te, await pdwEffect[0], pdwEffect);
						te.Data.DragTab = null;
					}
				}
			}
		},

		ChangeIcon: async function (Ctrl, o) {
			o.src = await GetIconImage(Ctrl, Addons.FolderButton.clBtnFace);
		}
	};

	//Menu
	const strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("ResetSortColumn", strName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.FolderButton.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.FolderButton.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Folder button", Addons.FolderButton.Exec);

	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	let s = item.getAttribute("Icon");
	if (!s) {
		s = "icon:shell32.dll,4,16";
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
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.FolderButton.Exec(this)" oncontextmenu="return Addons.FolderButton.Popup(this); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut(); Addons.FolderButton.Drag(this)" onmousedown="Addons.FolderButton.Button(true)" onmouseup="Addons.FolderButton.Button(false)">', await GetImgTag({ id: "FolderButton_$", title: strName, src: s }, h), '</span>']);
} else {
	EnableInner();
}
