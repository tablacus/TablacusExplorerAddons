var Addon_Id = "minimizebutton";
var Default = "ToolBar1Right";

var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.MinimizeButton =
	{
		Exec: function ()
		{
			api.SendMessage(te.hwnd, WM_SYSCOMMAND, SC_MINIMIZE, 0);
			return S_OK;
		}
	};

	var h = item.getAttribute("IconSize");
	var src = item.getAttribute("Icon");
	if (src) {
		src = '<img title="' + api.LoadString(hShell32, 9840) + '" src="' + EncodeSC(src) + '"';
		if (h) {
			h = h > 0 ? h + 'px' : EncodeSC(h);
			src += ' width="' + h + '" height="' + h + '"';
		}
		src += '>';
	} else {
		src = '<span style="font-family: marlett">&#x30;</span>';
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onmousedown="return Addons.MinimizeButton.Exec(this)" oncontextmenu="PopupContextMenu(ssfDRIVES)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">' ,src ,'</span>']);
}
