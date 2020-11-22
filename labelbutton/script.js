var Addon_Id = "labelbutton";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	var item = await GetAddonElement(Addon_Id);

	Addons.LabelButton = {
		Exec: async function (ev, el, mode) {
			MouseOver(el);
			var pt;
			if (mode) {
				pt = await api.Memory("POINT");
				pt.x = ev.screenX * ui_.Zoom;
				pt.y = ev.screenX * ui_.Zoom;
			} else {
				pt = await GetPosEx(el, 9);
			}
			Sync.LabelButton.Exec(pt, mode)
			return false;
		}
	};

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (WINVER >= 0x600 ? "icon:shell32.dll,289" : "../addons/label/label16.png");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="return Addons.LabelButton.Exec(event, this, 0)" oncontextmenu="return Addons.LabelButton.Exec(event, this, 1)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: await api.PSGetDisplayName("System.Contact.Label"), src: src }, h), '</span>']);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
