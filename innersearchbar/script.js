var Addon_Id = "innersearchbar";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.InnerSearchBar =
	{
		tid: [],
		search: [],
		iCaret: [],
		Icon: "bitmap:ieframe.dll,216,16,17",
		Width: '176px',

		Change: function (o, Id)
		{
			setTimeout(function ()
			{
				if (o.value.length == 0) {
					var FV = GetInnerFV(Id);
					if (IsSearchPath(FV)) {
						CancelFilterView(FV);
					}
				}
			}, 99);
		},

		KeyDown: function (o, Id)
		{
			setTimeout(function ()
			{
				Addons.InnerSearchBar.ShowButton(Id)
			}, 99);
			if (event.keyCode == VK_RETURN) {
				Addons.InnerSearchBar.Search(Id);
				(function (o) { setTimeout(function () {
					o.focus();
				}, 999);}) (o);
				return false;
			}
		},

		Search: function (Id)
		{
			var FV = GetInnerFV(Id);
			var s = document.F.elements["search_" + Id].value;
			if (s.length) {
				FV.FilterView(s);
			} else {
				CancelFilterView(FV);
			}
			this.ShowButton(Id);
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
			document.F.elements["search_" + Id].value = "";
			this.ShowButton(Id);
		},

		ShowButton: function (Id)
		{
			if (WINVER < 0x602) {
				var o = document.F.elements["search_" + Id];
				if (o) {
					document.getElementById("ButtonSearchClear_" + Id).style.display = o.value.length ? "inline" : "none";
				}
			}
		},

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			var o = document.F.elements["search_" + FV.Parent.Id];
			if (o) {
				o.focus();
			}
			return S_OK;
		}
	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var s = ['<input type="text" name="search_$" placeholder="Search" onkeydown="return Addons.InnerSearchBar.KeyDown(this,$)" onmouseup="Addons.InnerSearchBar.Change(this,$)" onfocus="Addons.InnerSearchBar.Focus(this, $)" style="width: ', EncodeSC(Addons.InnerSearchBar.Width), '; padding-right: 12pt; vertical-align: middle"><span style="position: relative"><input type="image" src="', EncodeSC(Addons.InnerSearchBar.Icon), '" hidefocus="true" style="position: absolute; left: -13.5pt; top: 1pt; width: 12pt; height: 12pt" oncontextmenu="return false" onclick="Addons.InnerSearchBar.Search($)"><span id="ButtonSearchClear_$" style="font-family: marlett; font-size: 7pt; display: none; position: absolute; left: -21pt; top: 3pt" class="button" onclick="Addons.InnerSearchBar.Clear(true, $)">r</span></span>'];
		var o = SetAddon(null, "Inner1Right_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});

	AddEvent("ChangeView", function (Ctrl)
	{
		if (Ctrl.Type <= CTRL_EB) {
			var Id = Ctrl.Parent.Id;
			var o = document.F.elements["search_" + Id];
			if (o) {
				o.value = IsSearchPath(Ctrl) ? api.GetDisplayNameOf(Ctrl, SHGDN_INFOLDER | SHGDN_ORIGINAL) : "";
				Addons.InnerSearchBar.ShowButton(Id);
			}
		}
	});

	if (item) {
		var s = item.getAttribute("Width");
		if (s) {
			Addons.InnerSearchBar.Width = (api.QuadPart(s) == s) ? (s + "px") : s;
		}
		var s = item.getAttribute("Icon");
		if (s) {
			Addons.InnerSearchBar.Icon = ExtractMacro(te, api.PathUnquoteSpaces(s));
		}
		Addons.InnerSearchBar.RE = item.getAttribute("RE");

		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.InnerSearchBar.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.InnerSearchBar.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.InnerSearchBar.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.InnerSearchBar.strName));
				ExtraMenuCommand[nPos] = Addons.InnerSearchBar.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.InnerSearchBar.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.InnerSearchBar.Exec, "Func");
		}
		AddTypeEx("Add-ons", "Inner Search Bar", Addons.InnerSearchBar.Exec);
	}
} else {
	SetTabContents(0, "General", '<table style="width: 100%"><tr><td style="width: 100%"><label>Width</label></td></tr><tr><td><input type="text" name="Width" size="10" /></td><td><input type="button" value="Default" onclick="document.F.Width.value=\'\'" /></td></tr></table>');
}
