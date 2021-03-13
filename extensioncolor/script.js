const Addon_Id = "extensioncolor";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	hint = await api.PSGetDisplayName("{E4F10A3C-49E6-405D-8288-A23BD4EEAA6C} 100") || "Extension";
	importScript("addons\\" + Addon_Id + "\\options.js");
}
