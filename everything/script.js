var Addon_Id = "everything";
var Default = "ToolBar2Right";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
var item = items.length ? items[0] : null;

EverythingDefaultPath = function ()
{
	var path = fso.BuildPath(api.GetDisplayNameOf(ssfPROGRAMFILES, SHGDN_FORPARSING), 'Everything\\es.exe');
	if (!fso.FileExists(path)) {
		var path2 = fso.BuildPath(api.GetDisplayNameOf(ssfPROGRAMFILESx86, SHGDN_FORPARSING), 'Everything\\es.exe');
		if (fso.FileExists(path2)) {
			path = path2;
		}
	}
	return path;
}

if (window.Addon == 1) {
	Addons.Everything =
	{
		PATH: "es:",
		ES: '"C:\\Program Files\\Everything\\es.exe"',
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
				document.getElementById("ButtonSearchClear").style.display = document.F.everythingsearch.value.length ? "inline" : "none";
			}
		},

		Exec: function ()
		{
			document.F.everythingsearch.focus();
			return S_OK;
		}
	};

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (api.PathMatchSpec(Path, Addons.Everything.PATH + "*")) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("ListViewCreated", function (Ctrl)
	{
		setTimeout(function () {
			var Path = Ctrl.FolderItem.Path;
			if (api.PathMatchSpec(Path, Addons.Everything.PATH + "*")) {
				Path = Path.replace(Addons.Everything.PATH, "").replace(/^\s+|\s+$|[>\|]/g, "");
				if (Path) {
					try {
						var exec = wsh.Exec('"' + wsh.ExpandEnvironmentStrings("%ComSpec%") + '" /C "' + Addons.Everything.ES + '" ' + Path);
						while (!exec.StdOut.AtEndOfStream) {
							Ctrl.AddItem(exec.StdOut.ReadLine());
						}
					} catch (e) {
						ShowError(e);
					}
				}
			}
		}, 200);
	});

	AddEvent("GetTabName", function (Ctrl)
	{
		var Path = Ctrl.FolderItem.Path;
		if (api.PathMatchSpec(Path, Addons.Everything.PATH + "*")) {
			return Path.replace(Addons.Everything.PATH, "");
		}
	}, true);

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
		AddTypeEx("Add-ons", "Search Bar", Addons.Everything.Exec);
		var s = item.getAttribute("Path");
		if (s) {
			Addons.Everything.ES = api.PathUnquoteSpaces(ExtractMacro(te, s));
		}
	}

	var s = ['<input type="text" name="everythingsearch" placeholder="Everything" onkeydown="return Addons.Everything.KeyDown(this)" onmouseup="Addons.Everything.Change(this)" onfocus="Addons.Everything.Focus(this)" onblur="Addons.Everything.ShowButton()" style="width:', width, '; padding-right:', osInfo.dwMajorVersion * 100 + osInfo.dwMinorVersion < 602 ? "32": "16", 'px; vertical-align: middle"><span class="button" style="position: relative"><input type="image" id="ButtonSearchClear" src="bitmap:ieframe.dll,545,13,1" onclick="Addons.Everything.Clear()" style="display: none; position: absolute; left: -33px; top: -5px" hidefocus="true"><input type="image" src="', icon, '" onclick="Addons.Everything.Search()" hidefocus="true" style="position: absolute; left: -18px; top: -7px; width 16px; height: 16px"></span>'];
	var o = document.getElementById(SetAddon(Addon_Id, Default, s));

	if (o.style.verticalAlign.length == 0) {
		o.style.verticalAlign = "middle";
	}
}
else {
	document.getElementById("tab0").value = "General";
	var ado = te.CreateObject("Adodb.Stream");
	ado.CharSet = "utf-8";
	ado.Open();
	var fname = [fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons"), Addon_Id, "options.html"].join("\\");
	ado.LoadFromFile(fname);
	document.getElementById("panel0").innerHTML = ado.ReadText();
	ado.Close();
	
	Ref = function ()
	{
		setTimeout(function ()
		{
			var commdlg = te.CommonDialog;
			var path = OpenDialog(document.getElementById("Path").value)
			if (path) {
				document.getElementById("Path").value = path;
			}
		}, 100);
	}

	SetDefaultPath = function ()
	{
		document.getElementById("Path").value = EverythingDefaultPath();
	}
}
