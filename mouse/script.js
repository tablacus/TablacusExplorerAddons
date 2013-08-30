var Addon_Id = "mouse";
var Default = "ToolBar1Center";

if (window.Addon == 1) { (function () {
	SetAddon(Addon_Id, Default, '<span id="mouse" style="color: gray; position: absolute;">&nbsp;</span>');
	var xml = OpenXml("mouse.xml", false, true);
	for (var mode in eventTE.Mouse) {
		var items = xml.getElementsByTagName(mode);
		if (items.length == 0 && api.strcmpi(mode, "List") == 0) {
			items = xml.getElementsByTagName("Folder");
		}
		for (i = 0; i < items.length; i++) {
			var item = items[i];
			SetGestureExec(mode, item.getAttribute("Mouse"), item.text, item.getAttribute("Type"));
		}
	}

	AddEvent("SetGestureText", function (Ctrl, Text)
	{
		document.getElementById("mouse").innerText = Text;
	});

})();}
