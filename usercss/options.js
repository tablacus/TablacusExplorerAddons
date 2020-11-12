SetTabContents(4, "CSS", '<form name="E" style=" height: 100%"><textarea name="css" style="width: 100%; height: 100%" onchange="g_bCss=true"></textarea></form>');
document.getElementById("toolbar").innerHTML = '<input type="button" value="Refresh" onclick="ReloadUserCss()" />&nbsp;<input type="button" value="Open" onclick="EditUserCss()">';

ReadUserCss = async function ()
{
	g_bCss = false;
	document.E.css.value = await ReadTextFile(BuildPath(await te.Data.DataFolder, "config\\user.css")) || "";
}

ReloadUserCss = async function ()
{
	if (!window.g_bCss || await confirmOk()) {
		ReadUserCss();
	}
}

EditUserCss = async function ()
{
	SaveUserCss();
	MainWindow.InvokeCommand(BuildPath(await te.Data.DataFolder, "config\\user.css"), 0, await te.hwnd, "Edit", null, null, SW_SHOWNORMAL, 0, 0, te, CMF_DEFAULTONLY);
}

SaveUserCss = async function ()
{
	if (window.g_bCss) {
		var fn = BuildPath(await te.Data.DataFolder, "config\\user.css");
		try {
			var ado = await api.CreateObject("ads");
			ado.CharSet = "utf-8";
			await ado.Open();
			await ado.WriteText(document.E.css.value.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n"));
			await ado.SaveToFile(fn, adSaveCreateOverWrite);
			ado.Close();
			g_bCss = false;
		} catch (e) {
			ShowError(e, fn);
		}
	}
}

SaveLocation = SaveUserCss;
setTimeout(ReadUserCss, 99);
