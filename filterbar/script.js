var Addon_Id = "filterbar";
var Default = "ToolBar2Right";

if (window.Addon == 1) {
	Addons.FilterBar =
	{
		tid: null,
		filter: null,
		iCaret: -1,

		KeyDown: function (o)
		{
			this.filter = o.value;
			clearTimeout(this.tid);
			this.tid = setTimeout(this.Change, 500);
		},

		Change: function ()
		{
			Addons.FilterBar.ShowButton();
			var FV = te.Ctrl(CTRL_FV);
			s = document.F.filter.value;
			if (s) {
				if (!s.match(/\*/)) {
					s = "*" + s + "*";
				}
			}
			if (api.strcmpi(s, FV.FilterView)) {
				FV.FilterView = s ? s : null;
				FV.Refresh();
			}
		},

		Focus: function (o)
		{
			o.select();
			if (this.iCaret >= 0) {
				var range = o.createTextRange();
				range.move("character", this.iCaret);
				range.select();
				this.iCaret = -1;
			}
		},

		Clear: function (flag)
		{
			document.F.filter.value = "";
			this.ShowButton();
			if (flag) {
				var FV = te.Ctrl(CTRL_FV);
				FV.FilterView = null;
				FV.Refresh();
			}
		},

		ShowButton: function ()
		{
			if (osInfo.dwMajorVersion * 100 + osInfo.dwMinorVersion < 602) {
				document.getElementById("ButtonFilter").style.display = document.F.filter.value.length ? "none" : "inline";
				document.getElementById("ButtonFilterClear").style.display = document.F.filter.value.length ? "inline" : "none";
			}
		}
	};

	AddEvent("ChangeView", function (Ctrl)
	{
		clearTimeout(Addons.FilterBar.tid);
		var s = Ctrl.FilterView;
		if (s.match(/^\*(.*)\*$/)) {
			s = RegExp.$1;
		}
		else if (api.strcmpi(s, "*") == 0) {
			s = "";
		}
		document.F.filter.value = s;
		Addons.FilterBar.ShowButton();
	});

	var s = '<input type="text" name="filter" placeholder="Filter" onkeydown="Addons.FilterBar.KeyDown(this)" onfocus="Addons.FilterBar.Focus(this)" onmouseup="Addons.FilterBar.KeyDown(this)" style="width: 176px; padding-right: 16px; vertical-align: middle"><span class="button" style="position: relative"><input type="image" src="../addons/filterbar/filter.png" id="ButtonFilter" hidefocus="true" style="position: absolute; left: -18px; top: -7px"><input type="image" id="ButtonFilterClear" src="bitmap:ieframe.dll,545,13,1" style="display: none; position: absolute; left: -17px; top: -4px" hidefocus="true" onclick="Addons.FilterBar.Clear(true)"></span>';
	var o = document.getElementById(SetAddon(Addon_Id, Default, s));

	if (o.style.verticalAlign.length == 0) {
		o.style.verticalAlign = "middle";
	}
}
