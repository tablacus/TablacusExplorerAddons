const Addon_Id = "hidetitlebar";
const Default = "None";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.HideTitleBar = {
		Enabled: true,

		Set: async function () {
			if (Addons.HideTitleBar.tid) {
				clearTimeout(Addons.HideTitleBar.tid);
				delete Addons.HideTitleBar.tid;
			}
			if (await api.IsWindowVisible(ui_.hwnd)) {
				let dwStyle = await api.GetWindowLongPtr(ui_.hwnd, GWL_STYLE);
				const dwStyle0 = dwStyle;
				if (Addons.HideTitleBar.Enabled) {
					dwStyle &= ~WS_CAPTION;
				} else {
					dwStyle |= WS_CAPTION;
				}
				if (dwStyle != dwStyle0) {
					await api.SetWindowLongPtr(ui_.hwnd, GWL_STYLE, dwStyle);
					const rc = await api.Memory("RECT");
					await api.GetWindowRect(ui_.hwnd, rc);
					const r = await Promise.all([rc.left, rc.right, rc.top, rc.bottom]);
					api.MoveWindow(ui_.hwnd, r[0], r[2], r[1] - r[0], r[3] - r[2] - 1, false);
					api.MoveWindow(ui_.hwnd, r[0], r[2], r[1] - r[0], r[3] - r[2], false);
				}
				Addons.HideTitleBar.Resize();
			} else {
				Addons.HideTitleBar.tid = setTimeout(Addons.HideTitleBar.Set, 999);
			}
		},

		Exec: function () {
			Addons.HideTitleBar.Enabled = !Addons.HideTitleBar.Enabled;
			Addons.HideTitleBar.Set();
			return S_OK;
		},

		Resize: async function () {
			if (Addons.HideTitleBar.Enabled && await api.IsZoomed(ui_.hwnd) && !(document.msFullscreenElement || document.fullscreenElement)) {
				const rc = await api.Memory("RECT");
				await api.GetWindowRect(ui_.hwnd, rc);
				const r = await Promise.all([rc.left, rc.right, rc.top, rc.bottom, api.Memory("POINT")]);
				const pt = r[4];
				pt.x = (r[0] + r[1]) / 2;
				pt.y = (r[2] + r[3]);
				if (!await api.MonitorFromPoint(pt, MONITOR_DEFAULTTONULL)) {
					const hMonitor = await api.MonitorFromPoint(pt, MONITOR_DEFAULTTOPRIMARY);
					const mi = await api.Memory("MONITORINFOEX");
					mi.cbSize = await mi.Size;
					await api.GetMonitorInfo(hMonitor, mi);
					const h = await mi.rcWork.top + await mi.rcWork.bottom - r[2] * 2;
					api.MoveWindow(ui_.hwnd, r[0], r[2], r[1] - r[0], h, true);
				}
			}
		}
	};

	AddEvent("Resize", Addons.HideTitleBar.Resize);
	AddEvent("Load", Addons.HideTitleBar.Set);

	AddEventId("AddonDisabledEx", Addon_Id, function () {
		Addons.HideTitleBar.Enabled = false;
		Addons.HideTitleBar.Set();
	});

	//Menu
	const strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("HideTitleBar", strName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.HideTitleBar.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.HideTitleBar.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Hide Tool bar", Addons.HideTitleBar.Exec);
	let h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.HideTitleBar.Exec();" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: strName, src: item.getAttribute("Icon") }, h), '</span>']);
}
