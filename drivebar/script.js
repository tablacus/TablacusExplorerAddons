const Addon_Id = "drivebar";
const Default = "ToolBar1Right";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.DriveBar = {
		SBSP: SBSP_NEWBROWSER,

		Open: function (o) {
			const path = o.path || o.getAttribute("path");
			Navigate(path, Addons.DriveBar.SBSP);
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
				const s0 = el.innerHTML;
				el.innerHTML = s;
				if (s0 != el.innerHTML) {
					Resize();
				}
			} else {
				setTimeout(Addons.DriveBar.Update, 999, s);
			}
		},

		SetSBSP: function () {
			Addons.DriveBar.SBSP = null;
		}
	};

	AddEvent("Layout", function () {
		return SetAddon(Addon_Id, Default, '<span id="drivebar"></span>');
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
