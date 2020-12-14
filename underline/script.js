const Addon_Id = "underline";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "Color", '<input type="text" id="Color" style="width: 7em" placeholder="#ececec" onchange="ChangeColor1(this)"><input id="Color_Color" type="button" value=" " class="color" onclick="ChooseColor2(this)">');
}
