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
			if (FV.Type == CTRL_EB) {
				var docRange = document.selection.createRange();
				var range = o.createTextRange();
				range.setEndPoint('EndToEnd', docRange);
				Addons.InnerFilterBar.iCaret[Id] = range.text.length;
			}
			s = o.value;
			if (!s.match(/\*/)) {
				s = "*" + s + "*";
			}
			FV.FilterView = s;
			FV.Refresh();

			if (FV.Type == CTRL_EB) {
				o.focus();
			}
		},

		Focus: function (o, Id)
		{
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
			}
		},

		ShowButton: function (Id, oFilter)
		{
			document.getElementById("ButtonFilter_" + Id).style.display = oFilter.value.length ? "none" : "inline";
			document.getElementById("ButtonFilterClear_" + Id).style.display = oFilter.value.length ? "inline" : "none";
		}

	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var s = '<input type="text" name="filter_$" onkeydown="Addons.InnerFilterBar.KeyDown(this, $)" onfocus="Addons.InnerFilterBar.Focus(this, $)" style="width: 160px; vertical-align: middle"><span onclick="Addons.InnerFilterBar.Clear(true, $)" onmouseover="MouseOver(this)" onmouseout="MouseOut()" class="button" style="vertical-align: middle"><input type="image" src="../addons/innerfilterbar/filter.png" id="ButtonFilter_$" hidefocus="true" style="vertical-align: middle"><input type="image" id="ButtonFilterClear_$" bitmap="ieframe.dll,206,16,2" style="display: none" hidefocus="true" style="vertical-align: middle"></span>';
		var o = SetAddon(null, "Inner1Right_" + Ctrl.Id, s.replace(/\$/g, Ctrl.Id));
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
