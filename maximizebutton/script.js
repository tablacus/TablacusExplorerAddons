var Addon_Id = "maximizebutton";
var Default = "ToolBar1Right";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.MaximizeButton =
	{
		Exec: function ()
		{
			api.SendMessage(te.hwnd, WM_SYSCOMMAND, api.IsZoomed(te.hwnd) ? SC_RESTORE : SC_MAXIMIZE, 0);
			return S_OK;
		},

		Popup: function (o)
		{
			wsh.SendKeys("% ");
			return false;
		}
	};

	var h = GetIconSize(item.getAttribute("IconSize"));
	var src = item.getAttribute("Icon");
	if (src) {
		src = GetImgTag({ id: "maximizebutton", title: api.LoadString(hShell32, 9841), src: src }, h);
	} else {
		var fh = "";
		if (item.getAttribute("IconSize")) {
			fh = '; font-size:' + (Number(h) ? h + "px" : h);
		}
		src = '<span id="maximizebutton" title="' + api.LoadString(hShell32, 9841) + '" style="font-family: marlett' + fh + '">&#x31;</span>';
	}
	AddEvent("Resize", function()
	{
		var o = document.getElementById("maximizebutton");
		if (o) {
			if (api.IsZoomed(te.hwnd)) {
				var hModule = api.GetModuleHandle(fso.BuildPath(system32, "user32.dll"));
				var hMenu = api.LoadMenu(hModule, 16);
				o.title = (api.GetMenuString(api.GetSubMenu(hMenu, 0), 61728, MF_BYCOMMAND) || "Restore").replace(/\(&.\)|&/, "");
				api.DestroyMenu(hMenu);
				if (/span/i.test(o.tagName)) {
					o.innerHTML = "&#x32;";
				}
			} else {
				o.title = api.LoadString(hShell32, 9841);
				if (/span/i.test(o.tagName)) {
					o.innerHTML = "&#x31;";
				}
			}
		}
	});
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.MaximizeButton.Exec(this)" oncontextmenu="return Addons.MaximizeButton.Popup(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', src, '</span>']);
}
