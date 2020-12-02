const Addon_Id = "hidetitlebar";
const Default = "None";

const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.HideTitleBar = {
		Enabled: true,
		strName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Set: async function () {
			let dwStyle = await api.GetWindowLongPtr(ui_.hwnd, GWL_STYLE);
			const dwStyle0 = dwStyle;
			if (Addons.HideTitleBar.Enabled) {
				dwStyle &= ~WS_CAPTION;
			} else {
				dwStyle |= WS_CAPTION;
			}
			if (dwStyle != dwStyle0) {
				await api.SetWindowLongPtr(ui_.hwnd, GWL_STYLE, dwStyle | WS_VISIBLE);
				const rc = await api.Memory("RECT");
				await api.GetWindowRect(ui_.hwnd, rc);
				const left = await rc.left, top = await rc.top, right = await rc.right, bottom = await rc.bottom;
				api.MoveWindow(ui_.hwnd, left, top, right - left, bottom - top - 1, false);
				api.MoveWindow(ui_.hwnd, left, top, right - left, bottom - top, false);
			}
			Addons.HideTitleBar.Resize();
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
				const pt = await api.Memory("POINT");
				pt.x = (await rc.left + await rc.right) / 2;
				pt.y = (await rc.top + await rc.bottom);
				if (!await api.MonitorFromPoint(pt, MONITOR_DEFAULTTONULL)) {
					const hMonitor = await api.MonitorFromPoint(pt, MONITOR_DEFAULTTOPRIMARY);
					const mi = await api.Memory("MONITORINFOEX");
					mi.cbSize = await mi.Size;
					await api.GetMonitorInfo(hMonitor, mi);
					const h = await mi.rcWork.top + await mi.rcWork.bottom - await rc.top * 2;
					api.MoveWindow(ui_.hwnd, await rc.left, await rc.top, await rc.right - await rc.Left, h, true);
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
	if (item.getAttribute("MenuExec")) {
		Common.HideTitleBar = await api.CreateObject("Object");
		Common.HideTitleBar.strMenu = item.getAttribute("Menu");
		Common.HideTitleBar.strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
		Common.HideTitleBar.nPos = GetNum(item.getAttribute("MenuPos"));
		$.importScript("addons\\" + Addon_Id + "\\sync.js");
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
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.HideTitleBar.Exec();" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: Addons.HideTitleBar.strName, src: item.getAttribute("Icon") }, h), '</span>']);
}
