SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

GetXmlAttr = async function (item, n, s) {
	if (n == "TextContent") {
		if (!s) {
			s = ui_.AttrPath;
			if (!s) {
				ui_.AttrPath = await $.GetAddonElement(Addon_Id).getAttribute("Root");
				s = ui_.AttrPath;
			}
		}
	}
	return s;
}

SetXmlAttr = async function (item, n, s) {
	if (n == "TextContent") {
		if (ui_.AttrPath) {
			item.removeAttribute("Root");
		}
	}
	return s;
}
