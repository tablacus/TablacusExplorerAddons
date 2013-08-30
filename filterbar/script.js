var Addon_Id = "filterbar";
var Default = "ToolBar2Right";

if (window.Addon == 1) {
	Addons.FilterBar =
	{
		tid: null,
		filter: null,
		iCaret: -1,

		Init: function ()
		{
			var s = '<input type="text" name="filter" onkeydown="Addons.FilterBar.KeyDown(this)" onfocus="Addons.FilterBar.Focus(this)" style="width: 160px; vertical-align: middle"><span onclick="Addons.FilterBar.Clear(true)" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" style="vertical-align: middle"><input type="image" src="../addons/filterbar/filter.png" id="ButtonFilter" hidefocus="true" style="vertical-align: middle"><input type="image" id="ButtonFilterClear" bitmap="ieframe.dll,206,16,2" style="display: none" hidefocus="true" style="vertical-align: middle"></span>';
			var o = document.getElementById(SetAddon(Addon_Id, Default, s));

			if (o.style.verticalAlign.length == 0) {
				o.style.verticalAlign = "middle";
			}
		},

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
			if (FV.Type == CTRL_EB) {
				var docRange = document.selection.createRange();
				var range = document.F.filter.createTextRange();
				range.setEndPoint('EndToEnd', docRange);
				Addons.FilterBar.iCaret = range.text.length;
			}
			s = document.F.filter.value;
			if (!s.match(/\*/)) {
				s = "*" + s + "*";
			}
			FV.FilterView = s;
			FV.Refresh();
			if (FV.Type == CTRL_EB) {
				document.F.filter.focus();
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
			document.getElementById("ButtonFilter").style.display = document.F.filter.value.length ? "none" : "inline";
			document.getElementById("ButtonFilterClear").style.display = document.F.filter.value.length ? "inline" : "none";
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

	Addons.FilterBar.Init();
}
