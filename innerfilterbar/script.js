Addon_Id = "innerfilterbar";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
}
if (window.Addon == 1) {
	Addons.InnerFilterBar =
	{
		tid: [],
		filter: [],
		iCaret: [],
		Icon: '../addons/innerfilterbar/filter.png',
		Width: '176px',

		IncludeObject: function (Ctrl, Path1, Path2)
		{
			return Ctrl.Data.RE.test(Path1) || (Path1 != Path2 && Ctrl.Data.RE.test(Path2)) ? S_OK : S_FALSE;
		},

		KeyDown: function (o, Id)
		{
			if (window.event.keyCode != VK_PROCESSKEY) {
				this.filter[Id] = o.value;
				clearTimeout(this.tid[Id]);
				this.tid[Id] = setTimeout("Addons.InnerFilterBar.Change(" + Id + ")", 500);
			}
		},

		KeyUp: function (o, Id)
		{
			if (window.event.keyCode == VK_RETURN) {
				this.KeyDown(o, Id);
			}
		},

		Change: function (Id)
		{
			var o = document.F.elements["filter_" + Id];
			Addons.InnerFilterBar.ShowButton(Id, o);
			var FV =  GetInnerFV(Id);
			s = o.value;

			if (Addons.InnerFilterBar.RE) {
				if (String(s).toLowerCase() != FV.FilterView.toLowerCase() || s && !FV.OnIncludeObject) {
					if (s) {
						FV.FilterView = s;
						try {
							FV.Data.RE = new RegExp((window.migemo && migemo.query(s)) || s, "i");
							FV.OnIncludeObject = Addons.InnerFilterBar.IncludeObject;
						} catch (e) {
							FV.OnIncludeObject = null;
						}
					} else {
						FV.FilterView = null;
						FV.OnIncludeObject = null;
					}
					FV.Refresh();
				}
				return;
			}
			if (s && !/[\*\?]/.test(s)) {
				s = "*" + s + "*";
			}
			if (String(s).toLowerCase() != FV.FilterView.toLowerCase()) {
				FV.FilterView = s ? s : null;
				FV.OnIncludeObject = null;
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
				FV.OnIncludeObject = null;
				FV.Refresh();
				FV.Focus();
			}
		},

		ShowButton: function (Id, oFilter)
		{
			if (WINVER < 0x602) {
				document.getElementById("ButtonFilter_" + Id).style.display = oFilter.value.length ? "none" : "inline";
				document.getElementById("ButtonFilterClear_" + Id).style.display = oFilter.value.length ? "inline" : "none";
			}
		},

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			var o = document.F.elements["filter_" + FV.Parent.Id];
			if (o) {
				o.focus();
			}
			return S_OK;
		},

		GetFilter: function (Ctrl)
		{
			if (Ctrl.Type <= CTRL_EB) {
				var Id = Ctrl.Parent.Id;
				var o = document.F.elements["filter_" + Id];
				if (o) {
					clearTimeout(Addons.InnerFilterBar.tid[Id]);
					var s = Ctrl.FilterView;
					if (/^\*(.*)\*$/.test(s)) {
						s = RegExp.$1;
					} else if (s == "*") {
						s = "";
					}
					o.value = s;
					Addons.InnerFilterBar.ShowButton(Id, o);
					if (Addons.InnerFilterBar.RE && s && !Ctrl.OnIncludeObject) {
						Addons.InnerFilterBar.Change(Id);
					}
				}
			}
		}
	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var s = ['<input type="text" name="filter_$" placeholder="Filter" onkeydown="Addons.InnerFilterBar.KeyDown(this, $)"  onkeyup="Addons.InnerFilterBar.KeyUp(this, $)" onmouseup="Addons.InnerFilterBar.KeyDown(this, $)" onfocus="Addons.InnerFilterBar.Focus(this, $)" style="width: ', Addons.InnerFilterBar.Width, '; padding-right: 16px; vertical-align: middle"><span class="button" style="position: relative"><input type="image" src="', Addons.InnerFilterBar.Icon, '" id="ButtonFilter_$" hidefocus="true" style="position: absolute; left: -18px; top: -7px" width="16px" height="16px"><input type="image" id="ButtonFilterClear_$" src="bitmap:ieframe.dll,545,13,1" hidefocus="true" style="display: none; position: absolute; left: -17px; top: -4px" onclick="Addons.InnerFilterBar.Clear(true, $)"></span>'];
		var o = SetAddon(null, "Inner1Right_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});

	AddEvent("ChangeView", Addons.InnerFilterBar.GetFilter);
	AddEvent("Command", Addons.InnerFilterBar.GetFilter);

	if (item) {
		var s = item.getAttribute("Width");
		if (s) {
			Addons.InnerFilterBar.Width = (api.QuadPart(s) == s) ? (s + "px") : s;
		}
		var s = item.getAttribute("Icon");
		if (s) {
			Addons.InnerFilterBar.Icon = s;
		}
		Addons.InnerFilterBar.RE = item.getAttribute("RE");

		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.InnerFilterBar.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.InnerFilterBar.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.InnerFilterBar.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.InnerFilterBar.strName));
				ExtraMenuCommand[nPos] = Addons.InnerFilterBar.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.InnerFilterBar.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.InnerFilterBar.Exec, "Func");
		}
		AddTypeEx("Add-ons", "Inner Filter Bar", Addons.InnerFilterBar.Exec);
	}
} else {
	document.getElementById("tab0").value = "General";
	document.getElementById("panel0").innerHTML = '<table style="width: 100%"><tr><td><label>Width</label></td></tr><tr><td><input type="text" name="Width" size="10" /></td><td><input type="button" value="Default" onclick="document.F.Width.value=\'\'" /></td></tr><tr><td><label>Filter</label></td></tr><tr><td><input type="checkbox" id="RE" name="RE" /><label for="RE">Regular Expression</label>/<label for="RE">Migemo</label></td></tr></table>';
}
