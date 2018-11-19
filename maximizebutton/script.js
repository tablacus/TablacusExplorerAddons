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
		}
	};

	AddEvent("Resize", function()
	{
		var o = document.getElementById("maximizebutton");
		if (o) {
			o.innerHTML = api.IsZoomed(te.hwnd) ? "&#x32" : "&#x31;";
		}
	});

	var h = item.getAttribute("IconSize");
	var src = item.getAttribute("Icon");
	if (src) {
		src = '<img title="' + api.LoadString(hShell32, 9841) + '" src="' + EncodeSC(src) + '"';
		if (h) {
			h = h > 0 ? h + 'px' : EncodeSC(h);
			src += ' width="' + h + '" height="' + h + '"';
		}
		src += '>';
	} else {
		src = '<span id="maximizebutton" style="font-family: marlett">&#x31;</span>';
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onmousedown="return Addons.MaximizeButton.Exec(this)" oncontextmenu="PopupContextMenu(ssfDRIVES)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">' ,src ,'</span>']);
}
