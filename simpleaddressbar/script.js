var Addon_Id = "simpleaddressbar";
var Default = "ToolBar2Center";

if (window.Addon == 1) {
	g_simpleaddressbar =
	{
		SetAddress: window.SetAdderss,

		Init: function ()
		{
			var s = '<input id="simpleaddressbar" type="text" onkeydown="return g_simpleaddressbar.KeyDown(this)" onfocus="this.select()" style="width: 100%; vertical-align: middle;	box-sizing: border-box;">';

			var o = document.getElementById(SetAddon(Addon_Id, Default, s));

			if (o.style.verticalAlign.length == 0) {
				o.style.verticalAlign = "middle";
			}
		},

		KeyDown: function (o)
		{
			if (event.keyCode == VK_RETURN) {
				var o = document.F.simpleaddressbar;
				var p = GetPos(o);
				var pt = api.Memory("POINT");
				pt.x = screenLeft + p.x;
				pt.y = screenTop + p.y + o.offsetHeight;
				window.Input = o.value;
				if (ExecMenu(te.Ctrl(CTRL_WB), "Alias", pt, 2) != S_OK) {
					Navigate(o.value, OpenMode);
				}
				return false;
			}
			return true;
		}

	};

	AddEvent("ChangeView", function (Ctrl)
	{
		if (Ctrl.FolderItem) {
			document.F.simpleaddressbar.value = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		}
	});

	SetAddress = function (s)
	{
		document.F.simpleaddressbar.value = s;
		return g_simpleaddressbar.SetAddress ? g_simpleaddressbar.SetAddress(s) : S_OK;
	}

	GetAddress = function ()
	{
		return document.F.simpleaddressbar.value;
	}

	g_simpleaddressbar.Init();
}
