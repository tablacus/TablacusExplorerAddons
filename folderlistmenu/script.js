Addon_Id = "folderlistmenu";
if (window.Addon == 1) {
	Addons.FolderListMenu = {
		NewTab: GetAddonOption("folderlistmenu", "NewTab"),

		Exec: function (oMenu, items, pt) {
			setTimeout(async function () {
				if (!pt) {
					pt = await api.Memory("POINT");
					await api.GetCursorPos(pt);
					const Ctrl2 = await te.CtrlFromPoint(pt);
					if (Ctrl2 && await Ctrl2.Type == CTRL_WB) {
						const ptc = await pt.Clone();
						await api.ScreenToClient(await WebBrowser.hwnd, ptc);
						const el = document.elementFromPoint(await ptc.x, await ptc.y);
						if (el) {
							pt = GetPos(el, 9);
						}
					}
				}
				const nVerb = await api.TrackPopupMenuEx(await oMenu['\\'], TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y, ui_.hwnd, null);

				for (let list = await api.CreateObject("Enum", oMenu); !await list.atEnd(); await list.moveNext()) {
					api.DestroyMenu(await oMenu[await list.item()]);
				}
				if (nVerb) {
					FolderMenu.Invoke(await items[nVerb - 1], await Addons.FolderListMenu.NewTab ? SBSP_NEWBROWSER : 0);
				}
			}, 99);
		}
	}

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", '<table style="width: 100%"><tr><td><input type="checkbox" id="NewTab"><label for="NewTab">New Tab</label></td></tr></table>');
}
