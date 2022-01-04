const Addon_Id = "colorlabels";
const item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", 1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	Addons.ColorLabels = {
		StartSync: function () {
			if (Addons.ColorLabels.tidSync) {
				clearTimeout(Addons.ColorLabels.tidSync);
			}
			Addons.ColorLabels.tidSync = setTimeout(function () {
				delete Addons.ColorLabels.tidSync;
				InvokeFunc(Sync.ColorLabels.ClearSync);
			}, 500);
		}
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="Portable">Portable</label><br><label><input type="checkbox" id="Tabs">Tabs</label>');
}
