var Addon_Id = "autosave";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);
	setInterval(SaveConfig, (item && item.getAttribute("Interval") || 5) *  60000);
} else {
	document.getElementById("tab0").value = "General";
	document.getElementById("panel0").innerHTML = '<table><td><input type="text" name="Interval" size="4" /></td><td><input type="button" value="Default" onclick="document.F.Interval.value=\'\'" /></td></tr></table>';
}
