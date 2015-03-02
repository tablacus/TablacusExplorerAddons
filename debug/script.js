var Addon_Id = "debug";
var Default = "BottomBar2Left";

if (window.Addon == 1) {
	Addons.Debug =
	{
		alert: function (s)
		{
			var o = document.getElementById("debug");
			o.value += "\n" + s;
			o.scrollTop = o.scrollHeight;
		},
		clear: function ()
		{
			var o = document.getElementById("debug");
			o.value = "Ready.";
		}
	};
	SetAddon(Addon_Id, Default, '<textarea id="debug" style="width: 100%; height: 100px">Ready.</textarea>');

	AddEventEx(window, "beforeunload", Addons.Debug.clear);
}
