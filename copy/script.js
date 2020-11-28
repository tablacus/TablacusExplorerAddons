var Addon_Id = "copy";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	var item = await GetAddonElement(Addon_Id);

	Addons.Copy = {
		strName: item.getAttribute("MenuName") || await api.LoadString(hShell32, 33561),

		Exec: async function (Ctrl, pt) {
			var FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				var Items = await FV.SelectedItems();
				if (await Items.Count) {
					var hMenu = await api.CreatePopupMenu();
					var ContextMenu = await api.ContextMenu(Items, FV);
					if (ContextMenu) {
						await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
						await ContextMenu.InvokeCommand(0, ui_.hwnd, CommandID_COPY - 1, null, null, SW_SHOWNORMAL, 0, 0);
					}
					api.DestroyMenu(hMenu);
				}
			}
			return S_OK;
		},

		State: async function (Ctrl) {
			if (Ctrl && await Ctrl.Type <= CTRL_EB) {
				let o = document.getElementById("ImgCopy_$");
				if (o) {
					if (await Ctrl.Id == await te.Ctrl(CTRL_FV).Id) {
						DisableImage(o, await Ctrl.ItemCount(SVGIO_SELECTION) == 0);
					}
				} else {
					const cTC = await te.Ctrls(CTRL_TC);
					for (let i = await cTC.Count; i-- > 0;) {
						o = document.getElementById("ImgCopy_" + await cTC[i].Id);
						if (o) {
							DisableImage(o, await cTC[i].Selected.ItemCount(SVGIO_SELECTION) == 0);
						}
					}
				}
			}
		}
	};

	AddEvent("SelectionChanged", Addons.Copy.State);
	//Menu
	if (item.getAttribute("MenuExec")) {
		Common.Copy = await api.CreateObject("Object");
		Common.Copy.strMenu = item.getAttribute("Menu");
		Common.Copy.strName = Addons.Copy.strName;
		Common.Copy.nPos = GetNum(item.getAttribute("MenuPos"));
		$.importScript("addons\\" + Addon_Id + "\\sync.js");
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Copy.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Copy.Exec, "Async");
	}
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,6" : "bitmap:ieframe.dll,214,24,6");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Copy.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: Addons.Copy.strName, id: "ImgCopy_$", src: src }, h), '</span>']);
} else {
	EnableInner();
}
