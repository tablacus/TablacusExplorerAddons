var Addon_Id = "maximizebutton";
var Default = "ToolBar1Right";

var item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.MaximizeButton =
	{
		Exec: async function () {
			api.SendMessage(ui_.hwnd, WM_SYSCOMMAND, await api.IsZoomed(ui_.hwnd) ? SC_RESTORE : SC_MAXIMIZE, 0);
			return S_OK;
		},

		Popup: function (ev) {
			var x = ev.screenX * ui_.Zoom;
			var y = ev.screenY * ui_.Zoom;
			api.PostMessage(te.hwnd, 0x313, 0, x + (y << 16));
			return false;
		}
	};

	var h = GetIconSize(item.getAttribute("IconSize"));
	var src = item.getAttribute("Icon");
	if (src) {
		src = await GetImgTag({ id: "maximizebutton", title: await api.LoadString(hShell32, 9841), src: src }, h);
	} else {
		var fh = "";
		if (item.getAttribute("IconSize")) {
			fh = '; font-size:' + (Number(h) ? h + "px" : h);
		}
		src = '<span id="maximizebutton" title="' + await api.LoadString(hShell32, 9841) + '" style="font-family: marlett' + fh + '">&#x31;</span>';
	}
	AddEvent("Resize", async function () {
		var o = document.getElementById("maximizebutton");
		if (o) {
			if (await api.IsZoomed(ui_.hwnd)) {
				var hModule = await api.GetModuleHandle(BuildPath(system32, "user32.dll"));
				var hMenu = await api.LoadMenu(hModule, 16);
				o.title = (await api.GetMenuString(await api.GetSubMenu(hMenu, 0), 61728, MF_BYCOMMAND) || "Restore").replace(/\(&.\)|&/, "");
				api.DestroyMenu(hMenu);
				if (/span/i.test(o.tagName)) {
					o.innerHTML = "&#x32;";
				}
			} else {
				o.title = await api.LoadString(hShell32, 9841);
				if (/span/i.test(o.tagName)) {
					o.innerHTML = "&#x31;";
				}
			}
		}
	});
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.MaximizeButton.Exec()" oncontextmenu="return Addons.MaximizeButton.Popup(event)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', src, '</span>']);
}
