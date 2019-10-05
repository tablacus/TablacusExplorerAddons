var Addon_Id = "touchex";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", 1);
	item.setAttribute("MenuName", "Change the Time Stamp...");

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	Addons.TouchEx =
	{
		Exec: function (Ctrl, pt)
		{
			var Selected = GetSelectedArray(Ctrl, pt, true).shift();
			if (Selected && Selected.Count) {
				ShowDialog("../addons/touchex/dialog.html", { MainWindow: MainWindow, Selected: Selected, width: 320, height: 280 });
			}
		}
	}

	var s = item.getAttribute("MenuName");
	if (s && s != "") {
		Addons.TouchEx.strName = GetText(s);
	}
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.TouchEx.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
		{
			if (item && item.IsFileSystem) {
				api.InsertMenu(hMenu, Addons.TouchEx.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.TouchEx.strName);
				ExtraMenuCommand[nPos] = Addons.TouchEx.Exec;
			}
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.TouchEx.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.TouchEx.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Change the Time Stamp...", Addons.TouchEx.Exec);
}
if (window.Addon == 2) {
	MainWindow.RunEvent1("BrowserCreated", document);
	
	window.SetTimeStamp = function ()
	{
		for (var i = dialogArguments.Selected.Count; i-- > 0;) {
			SetFileTime(dialogArguments.Selected.Item(i).Path, document.F.dt_1.value, document.F.dt_2.value, document.F.dt_0.value);
		}
		window.close();
		return true;
	};

	document.onkeydown = function ()
	{
		if (event.keyCode == VK_ESCAPE) {
			window.close();
		}
		if (event.keyCode == VK_RETURN) {
			SetTimeStamp();
		}
		return true;
	};

	AddEventEx(window, "load", function ()
	{
		ApplyLang(document);
		var item = dialogArguments.Selected.Item(0);
		var s = item.Path;
		var wfd = api.Memory("WIN32_FIND_DATA");
		var hFind = api.FindFirstFile(s, wfd);
		if (hFind == INVALID_HANDLE_VALUE) {
			if (api.SHGetDataFromIDList(item, SHGDFIL_FINDDATA, wfd, wfd.Size) != S_OK) {
				window.close();
			}
		} else {
			api.FindClose(hFind);
		}
		var ar = [wfd.ftLastWriteTime, wfd.ftCreationTime, wfd.ftLastAccessTime];
		var n = dialogArguments.Selected.Count;
		s = te.OnReplacePath(s) || s;
		document.getElementById("Path").innerHTML = (n > 1) ? s += " : " + n : s;

		for (var i = 3; i--;) {
			document.getElementById("label_" + i).innerHTML = api.PSGetDisplayName("{B725F130-47EF-101A-A5F1-02608C9EEBAC} " + (i + 14));
			s = FormatDateTime(ar[i]);
			document.F.elements["dt_" + i].value = s;
			document.getElementById("od_"+ i).innerHTML = s;
		}
		document.F.dt_0.select();
		document.F.dt_0.focus();
	});
}
