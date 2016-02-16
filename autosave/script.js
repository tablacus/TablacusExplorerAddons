var Addon_Id = "autosave";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);
	setInterval(SaveConfig, (item && item.getAttribute("Interval") || 5) *  60000);
	
	AddEvent("SystemMessage", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Ctrl.Type == CTRL_TE) {
			if (msg == WM_SYSCOMMAND) {
				if (wParam >= 0xf000) {
					switch (wParam & 0xFFF0) {
						case SC_MINIMIZE:
						case SC_CLOSE:
							SaveConfig();
							break;
					}
				}
			}
		}
	});
} else {
	document.getElementById("tab0").value = "General";
	document.getElementById("panel0").innerHTML = '<table><td><input type="text" name="Interval" size="4" /></td><td><input type="button" value="Default" onclick="document.F.Interval.value=\'\'" /></td></tr></table>';
}
