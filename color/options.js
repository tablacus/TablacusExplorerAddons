var s = ['<label>Default</label><br />'];
s.push('<input type="text" id="Default" style="width: 7em" onchange="ChangeColor1(this)" />');
s.push('<input id="Color_Default" type="button" value=" " class="color" onclick="ChooseColor2(this)" /><br />');
s.push('<label>Background</label><br />');
s.push('<input type="text" id="Background" style="width: 7em" onchange="ChangeColor1(this)" />');
s.push('<input id="Color_Background" type="button" value=" " class="color" onclick="ChooseColor2(this)" />');
var info = GetAddonInfo(Addon_Id);
SetTabContents(0, info.Name, s);
