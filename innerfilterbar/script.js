var Addon_Id = "innerfilterbar";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.InnerFilterBar =
	{
		tid: [],
		filter: [],
		iCaret: [],
		Icon: '../addons/innerfilterbar/filter.png',
		Width: '176px',

		KeyDown: function (o, Id)
		{
			var k = window.event.keyCode;
			if (k != VK_PROCESSKEY) {
				this.filter[Id] = o.value;
				clearTimeout(this.tid[Id]);
				if (k == VK_RETURN) {
					this.Change(Id);
					return false;
				} else {
					this.tid[Id] = setTimeout("Addons.InnerFilterBar.Change(" + Id + ")", 500);
				}
			}
		},

		KeyUp: function (o, Id)
		{
			var k = window.event.keyCode;
			if (k == VK_UP || k == VK_DOWN) {
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC) {
					var FV = TC.Selected;
					if (FV) {
						FV.Focus();
						return false;
					}
				}
			}
		},

		Change: function (Id)
		{
			var o = document.F.elements["filter_" + Id];
			Addons.InnerFilterBar.ShowButton(o, Id);
			var FV =  GetInnerFV(Id);
			s = o.value;

			if (s) {
				if (Addons.InnerFilterBar.RE && !/^\*|\//.test(s)) {
					s = "/" + s + "/i";
				} else {
					if (!/^\//.test(s)) {
						var ar = s.split(/;/);
						for (var i in ar) {
							var res = /^([^\*\?]+)$/.exec(ar[i]); 
							if (res) {
								ar[i] = "*" + res[1] + "*";
							}
						}
						s = ar.join(";");
					}
				}
			}
			if (String(s).toLowerCase() != FV.FilterView.toLowerCase()) {
				FV.FilterView = s || null;
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
			this.ShowButton(o, Id);
			if (flag) {
				var FV =  GetInnerFV(Id);
				FV.FilterView = null;
				FV.Refresh();
				FV.Focus();
			}
		},

		ShowButton: function (oFilter, Id)
		{
			if (WINVER < 0x602) {
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
					var s = Addons.InnerFilterBar.GetString(Ctrl.FilterView);
					if (s != Addons.InnerFilterBar.GetString(o.value)) {
						o.value = s;
						Addons.InnerFilterBar.ShowButton(o, Id);
					}
				}
			}
		},

		GetString: function (s)
		{
			if (Addons.InnerFilterBar.RE) {
				var res = /^\/(.*)\/i/.exec(s);
				if (res) {
					s = res[1];
				}
			} else if (s && !/^\//.test(s)) {
				var ar = s.split(/;/);
				for (var i in ar) {
					var res = /^\*([^/?/*]+)\*$/.exec(ar[i]);
					if (res) {
						ar[i] = res[1];
					}
				}
				s = ar.join(";");
			}
			return s;
		},

		FilterList: function (o, id)
		{
			if (Addons.FilterList) {
				Addons.FilterList.Exec(o, null, id);
			}
			return false;
		}
	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var s = ['<input type="text" name="filter_$" placeholder="Filter" onkeydown="return Addons.InnerFilterBar.KeyDown(this,$)"  onkeyup="return Addons.InnerFilterBar.KeyUp(this, $)" onmouseup="Addons.InnerFilterBar.KeyDown(this,$)" onfocus="Addons.InnerFilterBar.Focus(this, $)" onblur="Addons.InnerFilterBar.ShowButton(this,$)" ondblclick="return Addons.InnerFilterBar.FilterList(this,$)" style="width: ', EncodeSC(Addons.InnerFilterBar.Width), '; padding-right: 16px; vertical-align: middle"><span class="button" style="position: relative"><input type="image" src="', EncodeSC(Addons.InnerFilterBar.Icon), '" id="ButtonFilter_$" hidefocus="true" style="position: absolute; left: -18px; top: -7px" width="16px" height="16px" onclick="return Addons.InnerFilterBar.FilterList(this,$)" oncontextmenu="return Addons.InnerFilterBar.FilterList(this,$)"><input type="image" id="ButtonFilterClear_$" src="bitmap:ieframe.dll,545,13,1" hidefocus="true" style="display: none; position: absolute; left: -32px; top: -4px" onclick="Addons.InnerFilterBar.Clear(true, $)"></span>'];
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
			Addons.InnerFilterBar.Icon = ExtractMacro(te, api.PathUnquoteSpaces(s));
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
	SetTabContents(0, "General", '<table style="width: 100%"><tr><td><label>Width</label></td></tr><tr><td><input type="text" name="Width" size="10" /></td><td><input type="button" value="Default" onclick="document.F.Width.value=\'\'" /></td></tr><tr><td><label>Filter</label></td></tr><tr><td><input type="checkbox" id="RE" name="RE" /><label for="RE">Regular Expression</label>/<label for="RE">Migemo</label></td></tr></table>');
}
