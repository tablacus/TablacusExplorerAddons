var t = GetText("Tool bar");
var r = {
	Commands: t,
	Commands_organize: t + "(" + GetTextR("@shell32.dll,-31411") + ")",
	Commands_view: t + "(" + GetTextR("@shell32.dll,-31145") + ")",
	Details: GetTextR("@shell32.dll,-31415"),
	Navigation: GetTextR("@shell32.dll,-31421"),
	Preview: GetTextR("@shell32.dll,-31423"),
};
var s = [];
var ar = ["Default", "Visible", "Hidden"];
for (var n in Addons.FramePane.ep) {
	s.push(r[n], '<input type="text" name="', n, '" style="display: none"><br>');
	for (var i = 0; i < ar.length; i++) {
		s.push('<label><input type="radio" name="', n, '_" id="', n, '=', i, '" onclick="SetRadio(this)"', i ? "" : " checked" ,'>' , ar[i], '</label>&nbsp;');
	}
	s.push("<br>");
}
s.push("<br>", GetText("It takes time to apply these changes."));
SetTabContents(0, "", s);
