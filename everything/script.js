var Addon_Id = "everything";
var Default = "ToolBar2Right";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
var item = items.length ? items[0] : null;

if (window.Addon == 1) {
	Addons.Everything =
	{
		PATH: "es:",
		iCaret: -1,
		strName: "Everything",

		Change: function (o)
		{
		},

		KeyDown: function (o)
		{
			setTimeout(Addons.Everything.ShowButton, 100);
			if (event.keyCode == VK_RETURN) {
				Addons.Everything.Search();
				return false;
			}
		},

		Search: function ()
		{
			var FV = te.Ctrl(CTRL_FV);
			var s = document.F.everythingsearch.value;
			if (s.length) {
				FV.Navigate(Addons.Everything.PATH + s);
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
			Addons.Everything.ShowButton();
		},

		Clear: function ()
		{
			document.F.everythingsearch.value = "";
			Addons.Everything.ShowButton();
		},

		ShowButton: function ()
		{
			if (osInfo.dwMajorVersion * 100 + osInfo.dwMinorVersion < 602) {
				document.getElementById("ButtonEverythingClear").style.display = document.F.everythingsearch.value.length ? "inline" : "none";
			}
		},

		GetSearchString: function(Ctrl)
		{
			if (Ctrl.FolderItem) {
				var Path = Ctrl.FolderItem.Path;
				if (api.PathMatchSpec(Path, Addons.Everything.PATH + "*")) {
					return Path.replace(new RegExp("^" + Addons.Everything.PATH, "i"), "").replace(/^\s+|\s+$/g, "");
				}
			}
			return "";
		},

		Exec: function ()
		{
			document.F.everythingsearch.focus();
			return S_OK;
		},
	};

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (api.PathMatchSpec(Path, Addons.Everything.PATH + "*")) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("NavigateComplete", function (Ctrl)
	{
		setTimeout(function () {
			var Path = Addons.Everything.GetSearchString(Ctrl);
			if (Path) {
				var hwnd = api.FindWindow("EVERYTHING_TASKBAR_NOTIFICATION", null);
				if (hwnd) {
					var query = new ApiStruct({
						reply_hwnd: [VT_I4, 4],
						reply_copydata_message: [VT_I4, 4],
						search_flags: [VT_I4, api.sizeof("DWORD")],
						offset: [VT_I4, api.sizeof("DWORD")],
						max_results: [VT_I4, api.sizeof("DWORD")],
						search_string: [VT_LPWSTR, api.sizeof("WCHAR"), Path.length + 1],
					}, 4);
					query.Write("reply_hwnd", Ctrl.hwndView);
					query.Write("reply_copydata_message", 2);
					query.Write("max_results", 0xFFFFFFFF);
					query.Write("search_string", Path);

					var cds = api.Memory("COPYDATASTRUCT");
					cds.cbData = query.Size;
					cds.dwData = 2;//EVERYTHING_IPC_COPYDATAQUERY;
					cds.lpData = query.Memory;
					api.SendMessage(hwnd, WM_COPYDATA, Ctrl.hwndView, cds);
				}
			}
		}, 200);
	});

	AddEvent("CopyData", function (Ctrl, cd, wParam)
	{
		if (cd.dwData == 2 && cd.cbData) {
			var data = api.Memory("BYTE", cd.cbData, cd.lpData);
			var EVERYTHING_IPC_LIST =
			{
				totfolders: [VT_I4, api.sizeof("DWORD")],
				totfiles: [VT_I4, api.sizeof("DWORD")],
				totitems: [VT_I4, api.sizeof("DWORD")],
				numfolders: [VT_I4, api.sizeof("DWORD")],
				numfiles: [VT_I4, api.sizeof("DWORD")],
				numitems: [VT_I4, api.sizeof("DWORD")],
				offset: [VT_I4, api.sizeof("DWORD")],
			};
			var list = new ApiStruct(EVERYTHING_IPC_LIST, 4, data);
			var nItems = list.Read("totitems");

			var EVERYTHING_IPC_ITEM =
			{
				flags: [VT_I4, api.sizeof("DWORD")],
				filename_offset: [VT_I4, api.sizeof("DWORD")],
				path_offset: [VT_I4, api.sizeof("DWORD")],
			};
			var Items = Ctrl.Items();
			for (var i = Items.Count; i--;) {
				Ctrl.RemoveItem(Items.Item(i));
			}
			var item = new ApiStruct(EVERYTHING_IPC_ITEM, 4);
			var itemSize = item.Size;
			for (var i = 0; i < nItems; i++) {
				var item = new ApiStruct(EVERYTHING_IPC_ITEM, 4, api.Memory("BYTE", itemSize, cd.lpData + list.Size + list.Read("offset") + itemSize * i));
				Ctrl.AddItem(fso.BuildPath(data.Read(item.Read("path_offset"), VT_LPWSTR), data.Read(item.Read("filename_offset"), VT_LPWSTR)));
			}
			return S_OK;
		}
	});
	
	AddEvent("GetTabName", function (Ctrl)
	{
		var Path = Ctrl.FolderItem.Path;
		if (api.PathMatchSpec(Path, Addons.Everything.PATH + "*")) {
			return Path.replace(Addons.Everything.PATH, "");
		}
	}, true);

	AddEvent("ChangeView", function (Ctrl)
	{
		document.F.everythingsearch.value = Addons.Everything.GetSearchString(Ctrl);
		Addons.Everything.ShowButton();
	});

	var width = "176px";
	var icon = "bitmap:ieframe.dll,216,16,17";
	if (items.length) {
		var s = item.getAttribute("Width");
		if (s) {
			width = (api.QuadPart(s) == s) ? (s + "px") : s;
		}
		var s = item.getAttribute("Icon");
		if (s) {
			icon = s;
		}
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.Everything.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.Everything.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.Everything.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.Everything.strName));
				ExtraMenuCommand[nPos] = Addons.Everything.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Everything.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Everything.Exec, "Func");
		}
		AddTypeEx("Add-ons", "Everything", Addons.Everything.Exec);
	}

	var s = ['<input type="text" name="everythingsearch" placeholder="Everything" onkeydown="return Addons.Everything.KeyDown(this)" onmouseup="Addons.Everything.Change(this)" onfocus="Addons.Everything.Focus(this)" onblur="Addons.Everything.ShowButton()" style="width:', width, '; padding-right:', osInfo.dwMajorVersion * 100 + osInfo.dwMinorVersion < 602 ? "32": "16", 'px; vertical-align: middle"><span class="button" style="position: relative"><input type="image" id="ButtonEverythingClear" src="bitmap:ieframe.dll,545,13,1" onclick="Addons.Everything.Clear()" style="display: none; position: absolute; left: -33px; top: -5px" hidefocus="true"><input type="image" src="', icon, '" onclick="Addons.Everything.Search()" hidefocus="true" style="position: absolute; left: -18px; top: -7px; width 16px; height: 16px"></span>'];
	var o = document.getElementById(SetAddon(Addon_Id, Default, s));

	if (o.style.verticalAlign.length == 0) {
		o.style.verticalAlign = "middle";
	}
}
else {
	document.getElementById("tab0").value = "General";
	document.getElementById("panel0").innerHTML = '<input type="button" value="Get Everything..." title="http://www.voidtools.com/" onclick="wsh.Run(this.title)">';
}
