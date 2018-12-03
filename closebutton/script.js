var Addon_Id = "closebutton";
var Default = "ToolBar1Right";

var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.CloseButton =
	{
		Exec: function ()
		{
			api.SendMessage(te.hwnd, WM_SYSCOMMAND, SC_CLOSE, 0);
			return S_OK;
		},

		Popup: function (o)
		{
			wsh.SendKeys("% ");
		}
	};

	var h = item.getAttribute("IconSize");
	var src = item.getAttribute("Icon");
	if (src) {
		src = '<img title="' + api.LoadString(hShell32, 12851) + '" src="' + EncodeSC(src) + '"';
		if (h) {
			h = Number(h) ? h + 'px' : EncodeSC(h);
			src += ' width="' + h + '" height="' + h + '"';
		}
		src += '>';
	} else {
		src = '<span style="font-family: marlett">&#x72;</span>';
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.CloseButton.Exec(this)" oncontextmenu="Addons.CloseButton.Popup(this); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()">' ,src ,'</span>']);
}
