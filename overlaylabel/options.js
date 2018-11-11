var s = ['<label>Color</label><br />'];
s.push('<input type="text" id="Color" style="width: 7em" onchange="ChangeColor1(this)" />');
s.push('<input id="Color_Color" type="button" value=" " class="color" onclick="ChooseColor2(this)" /><br /><br />');
s.push('<label>View flags</label><br />');
var ar = ["0Icon", "2Small icon", "3List", "1Details", "4Tile"];
for (var i = 0; i < ar.length; i++) {
    var j = ar[i].substr(0, 1);
    s.push('<input type="checkbox" id="!No_', j ,'" /><label for="!No_', j ,'">', ar[i].substr(1),'</label>&nbsp;');
}
SetTabContents(0, "General", s);
