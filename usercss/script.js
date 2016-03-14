if (window.Addon == 1) {
	var link = document.createElement("link");
	link.rel = "stylesheet";
	link.type = "text/css";
	link.href = fso.BuildPath(te.Data.DataFolder, "config\\user.css");
	document.getElementsByTagName("head").item(0).appendChild(link);
} else {
	SetTabContents(4, "CSS", '<form name="E" style=" height: 100%"><textarea name="css" style="width: 100%; height: 100%" onchange="g_bCss=true"></textarea></form>');
	document.getElementById("toolbar").innerHTML = '<input type="button" value="Refresh" onclick="ReloadUserCss()" />&nbsp;<input type="button" value="Open" onclick="EditUserCss()" />';

	ReadUserCss = function ()
	{
		g_bCss = false;
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\user.css"));
		if (ado) {
			document.E.css.value = ado.ReadText(adReadAll);
			ado.Close();
		}
	}

	ReloadUserCss = function ()
	{
		if (!window.g_bCss || confirmOk("Are you sure?")) {
			ReadUserCss();
		}
	}

	EditUserCss = function ()
	{
		SaveUserCss();
		MainWindow.InvokeCommand(fso.BuildPath(te.Data.DataFolder, "config\\user.css"), 0, te.hwnd, "Edit", null, null, SW_SHOWNORMAL, 0, 0, te, CMF_DEFAULTONLY);
	}

	SaveUserCss = function ()
	{
		if (window.g_bCss) {
			var fn = fso.BuildPath(te.Data.DataFolder, "config\\user.css");
			try {
				var ado = te.CreateObject("Adodb.Stream");
				ado.CharSet = "utf-8";
				ado.Open();
				ado.WriteText(document.E.css.value.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n"));
				ado.SaveToFile(fn, adSaveCreateOverWrite);
				ado.Close();
				g_bCss = false;
			} catch (e) {
				ShowError(e, fn);
			}
		}
	}

	SaveLocation = SaveUserCss;
	ReadUserCss();
}
