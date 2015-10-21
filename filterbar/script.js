Addon_Id = "filterbar";
Default = "ToolBar2Right";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("MenuPos", -1);

		item.setAttribute("KeyExec", 1);
		item.setAttribute("KeyOn", "All");
		item.setAttribute("Key", "Ctrl+E");
	}
}

if (window.Addon == 1) {
	Addons.FilterBar =
	{
		tid: null,
		filter: null,
		iCaret: -1,
		strName: "Filter Bar",

		IncludeObject: function (Ctrl, Path1, Path2)
		{
			return Ctrl.Data.RE.test(Path1) || (Path1 != Path2 && Ctrl.Data.RE.test(Path2)) ? S_OK : S_FALSE;
		},

		KeyDown: function (o)
		{
			if (window.event.keyCode != VK_PROCESSKEY) {
				this.filter = o.value;
				clearTimeout(this.tid);
				this.tid = setTimeout(this.Change, 500);
			}
		},

		KeyUp: function (o)
		{
			if (window.event.keyCode == VK_RETURN) {
				this.KeyDown(o);
			}
		},

		Change: function ()
		{
			Addons.FilterBar.ShowButton();
			var FV = te.Ctrl(CTRL_FV);
			s = document.F.filter.value;
			if (Addons.FilterBar.RE) {
				if (String(s).toLowerCase() != FV.FilterView.toLowerCase() || !FV.OnIncludeObject) {
					if (s) {
						FV.FilterView = s;
						try {
							FV.Data.RE = new RegExp((window.migemo && migemo.query(s)) || s, "i");
							FV.OnIncludeObject = Addons.FilterBar.IncludeObject;
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
				FV.OnIncludeObject = null;
				FV.Refresh();
			}
		},

		ShowButton: function ()
		{
			if (WINVER < 0x602) {
				document.getElementById("ButtonFilter").style.display = document.F.filter.value.length ? "none" : "inline";
				document.getElementById("ButtonFilterClear").style.display = document.F.filter.value.length ? "inline" : "none";
			}
		},

		Exec: function ()
		{
			document.F.filter.focus();
			return S_OK;
		},

		GetFilter: function (Ctrl)
		{
			clearTimeout(Addons.FilterBar.tid);
			var s = Ctrl.FilterView;
			if (/^\*(.*)\*$/.test(s)) {
				s = RegExp.$1;
			} else if (s == "*") {
				s = "";
			}
			document.F.filter.value = s;
			Addons.FilterBar.ShowButton();
			if (Addons.FilterBar.RE && s && !Ctrl.OnIncludeObject) {
				Addons.FilterBar.Change();
			}
		}

	};

	AddEvent("ChangeView", Addons.FilterBar.GetFilter);
	AddEvent("Command", Addons.FilterBar.GetFilter);

	var width = "176px";
	var icon = "../addons/filterbar/filter.png";

	if (item) {
		var s = item.getAttribute("Width");
		if (s) {
			width = (api.QuadPart(s) == s) ? (s + "px") : s;
		}
		var s = item.getAttribute("Icon");
		if (s) {
			icon = s;
		}
		Addons.FilterBar.RE = item.getAttribute("RE");
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.FilterBar.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.FilterBar.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.FilterBar.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.FilterBar.strName));
				ExtraMenuCommand[nPos] = Addons.FilterBar.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.FilterBar.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.FilterBar.Exec, "Func");
		}
		AddTypeEx("Add-ons", "Filter Bar", Addons.FilterBar.Exec);
	}
	var s = ['<input type="text" name="filter" placeholder="Filter" onkeydown="Addons.FilterBar.KeyDown(this)" onkeyup="Addons.FilterBar.KeyUp(this)" onfocus="Addons.FilterBar.Focus(this)" onmouseup="Addons.FilterBar.KeyDown(this)" style="width:', width, '; padding-right: 16px; vertical-align: middle"><span class="button" style="position: relative"><input type="image" src="', icon, '" id="ButtonFilter" hidefocus="true" style="position: absolute; left: -18px; top: -7px"><input type="image" id="ButtonFilterClear" src="bitmap:ieframe.dll,545,13,1" style="display: none; position: absolute; left: -17px; top: -5px" hidefocus="true" onclick="Addons.FilterBar.Clear(true)"></span>'];

	var o = document.getElementById(SetAddon(Addon_Id, Default, s));

	if (o.style.verticalAlign.length == 0) {
		o.style.verticalAlign = "middle";
	}
} else {
	document.getElementById("tab0").value = "General";
	document.getElementById("panel0").innerHTML = '<table style="width: 100%"><tr><td><label>Width</label></td></tr><tr><td><input type="text" name="Width" size="10" /></td><td><input type="button" value="Default" onclick="document.F.Width.value=\'\'" /></td></tr><tr><td><label>Filter</label></td></tr><tr><td><input type="checkbox" id="RE" name="RE" /><label for="RE">Regular Expression</label>/<label for="RE">Migemo</label></td></tr></table>';
}
