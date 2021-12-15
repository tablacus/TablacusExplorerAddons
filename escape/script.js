const Addon_Id = "escape";
const Default = "ToolBar2Left";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	Addons.EscapeUnicode = {
		Popup: async function (el) {
			setTimeout(function (Ctrl, pt) {
				Sync.EscapeUnicode.Popup(Ctrl, pt);
			}, 99, await GetFolderView(el), await GetPosEx(el, 9));
		}
	};
	AddEvent("Layout", async function () {
		const h = GetIconSizeEx(item);
		const s = item.getAttribute("Icon") || '../addons/escape/' + (h > 16 ? 24 : 16) +  '.png';
		SetAddon(Addon_Id, Default, ['<span class="button" onmousedown="Addons.EscapeUnicode.Popup(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: await GetText("Escape Unicode"), src: s }, h), '</span>']);
	});
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
}
