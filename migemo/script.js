var Addon_Id = "migemo";

Addons.Migemo = 
{
	Init: function ()
	{
		try {
			var ado = OpenAdodbFromTextFile(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "lib\\migemo\\migemo.js"));
			var s = ado.ReadText(adReadAll);
			ado.Close();
		} catch (e) {
			s = "";
		}
		s = s.replace("var migemo =", "migemo =").replace(/window\.ActiveXObject[^\)]*\)/, 'true').replace('wo":"を"', 'wo":"を", "fa":"ふぁ", "fi":"ふぃ", "fu":"ふ", "fe":"ふぇ", "fo":"ふぉ"').replace('"cc":"xtuc"', '"cc":"xtuc", "hh":"xtuh"');

		(new Function(s))();
		if (window.migemo) {
			migemo.initialize(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "lib\\migemo"));
		}
		return window.migemo;
	}
}
if (window.Addon == 1) {
	if (!window.migemo) {
		Addons.Migemo.Init();
	}
} else {
	var s = [''];
	s.push('<table style="width: 100%"><tr><td><label>Test</label></td></tr><tr><td><input type="text" autocomplete="off" onkeyup="KeyUp(this)" style="width: 50%" /></td></td></tr>');
	s.push('<tr><td><label>Regular Expression</label></td></tr><tr><td><input type="text" id="_Migemo" style="width: 100%" readonly /></td></tr></table>');

	KeyUp = function (o)
	{
		var m = window.migemo || (MainWindow.Addons.Migemo && MainWindow.migemo) || Addons.Migemo.Init();
		if (m) {
			try {
				document.getElementById("_Migemo").value = m ? m.query(o.value) || o.value : o.value;
			} catch (e) {
				document.getElementById("_Migemo").value = e.description || e.toString();
			}
		}
	}
	s.push('<table style="width: 100%"><tr><td><label>Path</label></td></tr><tr><td style="width: 100%"><input type="text" readonly value="', fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "lib\\migemo\\migemo.js"), '"style="width: 100%" /></td><td><input type="button" value="Open" onclick="OpenLibrary()"></td></td></tr>');
	s.push('</table><br />');
	s.push('<table style="width: 100%"><tr><td style="width: 100%"><input type="button" value="', api.sprintf(999, GetText("Get %s..."), 'JavaScript/Migemo'), '" title="http://www.oldriver.org/jsmigemo/" onclick="wsh.Run(this.title)">');
	s.push('</td><td><input type="button" value="Install" onclick="InstallMigemo(this)"></td></tr></table>');
	SetTabContents(4, "General", s.join(""));

	OpenLibrary = function ()
	{
		var path = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "lib\\migemo");
		if (!IsExists(path)) {
			CreateFolder2(fso.GetParentFolderName(path));
			CreateFolder2(path);
		}
		MainWindow.Navigate(path, SBSP_NEWBROWSER);
	}

	InstallMigemo = function (o)
	{
		var url = "http://www.oldriver.org/jsmigemo/";
		var xhr = createHttpRequest();
		xhr.open("GET", url, false);
		xhr.setRequestHeader('Pragma', 'no-cache');
		xhr.setRequestHeader('Cache-Control', 'no-cache');
		xhr.setRequestHeader('If-Modified-Since', 'Thu, 01 Jun 1970 00:00:00 GMT');
		xhr.send(null);
		var res = /<a href="(jsmigemo.*\.zip)">/i.exec(xhr.responseText);
		if (!res) {
			return;
		}
		var file = res[1];
		if (!confirmOk(GetText("Do you want to install it now?") + "\r\n" + file)) {
			return;
		}
		var temp = fso.BuildPath(fso.GetSpecialFolder(2).Path, "tablacus");
		CreateFolder2(temp);
		var zipfile = fso.BuildPath(temp, file);
		temp += "\\migemo";
		CreateFolder2(temp);
		DownloadFile(url + file, zipfile);
		if (Extract(zipfile, temp) != S_OK) {
			return;
		}
		var migemojs = temp + "\\migemo\\migemo.js";
		var nDog = 300;
		while (!fso.FileExists(migemojs)) {
			if (wsh.Popup(GetText("Please wait."), 1, TITLE, MB_ICONINFORMATION | MB_OKCANCEL) == IDCANCEL || nDog-- == 0) {
				return;
			}
		}
		var oSrc = sha.NameSpace(temp);
		if (oSrc) {
			var Items = oSrc.Items();
			var dest = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "lib");
			CreateFolder2(dest);
			var oDest = sha.NameSpace(dest);
			if (oDest) {
				oDest.MoveHere(Items, FOF_NOCONFIRMATION | FOF_NOCONFIRMMKDIR);
				o.disabled = true;
				o.value = GetText("Installed");
			}
		}
	}
}
