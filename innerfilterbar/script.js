if (window.Addon == 1) {
	Addons.InnerFilterBar =
	{
		tid: [],
		filter: [],
		iCaret: [],

		KeyDown: function (o, Id)
		{
			this.filter[Id] = o.value;
			clearTimeout(this.tid[Id]);
			this.tid[Id] = setTimeout("Addons.InnerFilterBar.Change(" + Id + ")", 500);
		},

		Change: function (Id)
		{
			var o = document.F.elements["filter_" + Id];
			Addons.InnerFilterBar.ShowButton(Id, o);
			var FV =  GetInnerFV(Id);
			s = o.value;
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

		Focus: function (o, Id)
		{
			Activate(o, Id);
			o.select();
			if (this.iCaret[Id] >= 0) {
				var range = o.createTextRange();
				range.move("character", this.iCaret[Id]);
				range.select();
				this.iCaret[Id] = -1;
			}
		},

		Clear: function (flag, Id)
		{
			var o = document.F.elements["filter_" + Id];
			o.value = "";
			this.ShowButton(Id, o);
			if (flag) {
				var FV =  GetInnerFV(Id);
				FV.FilterView = null;
				FV.Refresh();
				FV.Focus();
			}
		},

		ShowButton: function (Id, oFilter)
		{
			if (osInfo.dwMajorVersion * 100 + osInfo.dwMinorVersion < 602) {
				document.getElementById("ButtonFilter_" + Id).style.display = oFilter.value.length ? "none" : "inline";
				document.getElementById("ButtonFilterClear_" + Id).style.display = oFilter.value.length ? "inline" : "none";
			}
		}

	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var s = GetAddonOption("innerfilterbar", "Icon") || '../addons/innerfilterbar/filter.png';
		var s = ['<input type="text" name="filter_$" placeholder="Filter" onkeydown="Addons.InnerFilterBar.KeyDown(this, $)" onmouseup="Addons.InnerFilterBar.KeyDown(this, $)" onfocus="Addons.InnerFilterBar.Focus(this, $)" style="width: 176px; padding-right: 16px; vertical-align: middle"><span class="button" style="position: relative"><input type="image" src="', s, '" id="ButtonFilter_$" hidefocus="true" style="position: absolute; left: -18px; top: -7px" width="16px" height="16px"><input type="image" id="ButtonFilterClear_$" src="bitmap:ieframe.dll,545,13,1" hidefocus="true" style="display: none; position: absolute; left: -17px; top: -4px" onclick="Addons.InnerFilterBar.Clear(true, $)"></span>'];
		var o = SetAddon(null, "Inner1Right_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});

	AddEvent("ChangeView", function (Ctrl)
	{
		var Id = Ctrl.Parent.Id;
		var o = document.F.elements["filter_" + Id];
		if (o) {
			clearTimeout(Addons.InnerFilterBar.tid[Id]);
			var s = Ctrl.FilterView;
			if (s.match(/^\*(.*)\*$/)) {
				s = RegExp.$1;
			}
			else if (api.strcmpi(s, "*") == 0) {
				s = "";
			}
			o.value = s;
			Addons.InnerFilterBar.ShowButton(Id, o);
		}
	});
}
