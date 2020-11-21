var Addon_Id = "stripeslite";
var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");

} else {
	SetTabContents(0, "", '<input type="text" id="Color2" style="width: 7em" placeholder="#ececec" onchange="ChangeColor1(this)"><input id="Color_Color2" type="button" value=" " class="color" onclick="ChooseColor2(this)">');
}
