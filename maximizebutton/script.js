const Addon_Id = "maximizebutton";
const Default = "ToolBar1Right";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.MaximizeButton = {
		Exec: async function () {
			api.SendMessage(ui_.hwnd, WM_SYSCOMMAND, await api.IsZoomed(ui_.hwnd) ? SC_RESTORE : SC_MAXIMIZE, 0);
			return S_OK;
		},

		Popup: function (ev) {
			const x = ev.screenX * ui_.Zoom;
			const y = ev.screenY * ui_.Zoom;
			api.PostMessage(ui_.hwnd, 0x313, 0, x + (y << 16));
		}
	};

	const h = GetIconSize(item.getAttribute("IconSize"), 13);
	const src = item.getAttribute("Icon") || "font:marlett,0x31";

	AddEvent("Resize", async function () {
		const o = document.getElementById("maximizebutton");
		if (o) {
			if (await api.IsZoomed(ui_.hwnd)) {
				const hModule = await api.GetModuleHandle(BuildPath(system32, "user32.dll"));
				const hMenu = await api.LoadMenu(hModule, 16);
				o.title = (await api.GetMenuString(await api.GetSubMenu(hMenu, 0), 61728, MF_BYCOMMAND) || "Restore").replace(/\(&.\)|&/, "");
				api.DestroyMenu(hMenu);
				if (/span/i.test(o.tagName) && /marlett/.test(o.style.fontFamily)) {
					o.innerHTML = "&#x32;";
				}
			} else {
				o.title = await api.LoadString(hShell32, 9841);
				if (/span/i.test(o.tagName) && /marlett/.test(o.style.fontFamily)) {
					o.innerHTML = "&#x31;";
				}
			}
		}
	});
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.MaximizeButton.Exec()" oncontextmenu="return Addons.MaximizeButton.Popup(event); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ id: "maximizebutton", title: await api.LoadString(hShell32, 9841), src: src }, h), '</span>']);
}
