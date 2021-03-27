const Addon_Id = "drivebar";
const Default = "ToolBar1Right";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.DriveBar = {
		Open: function (o) {
			const path = o.path || o.getAttribute("path");
			Navigate(path, SBSP_NEWBROWSER);
		},

		Popup: async function (ev, o) {
			const path = o.path || o.getAttribute("path");
			const ContextMenu = await api.ContextMenu(path);
			if (ContextMenu) {
				const hMenu = await api.CreatePopupMenu();
				await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_NORMAL);
				const x = ev.screenX * ui_.Zoom;
				const y = ev.screenY * ui_.Zoom;
				const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, x, y, ui_.hwnd, null, ContextMenu);
				if (nVerb) {
					ContextMenu.InvokeCommand(0, ui_.hwnd, nVerb - 1, null, null, SW_SHOWNORMAL, 0, 0);
				}
				api.DestroyMenu(hMenu);
			}
		},

		Update: function (s) {
			const el = document.getElementById("drivebar");
			if (el) {
				el.innerHTML = s;
			} else {
				setTimeout(Addons.DriveBar.Update, 999, s);
			}
		}
	};

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, '<span id="drivebar"></span>');
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
