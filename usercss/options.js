SetTabContents(4, "CSS", '<form name="E" style=" height: 100%"><textarea name="css" style="width: 100%; height: 100%" onchange="g_bCss=true"></textarea></form>');
document.getElementById("toolbar").innerHTML = '<input type="button" value="Refresh" onclick="ReloadUserCss()">&nbsp;<input type="button" value="Open" onclick="EditUserCss()">';

ReadUserCss = async function () {
	g_bCss = false;
	document.E.css.value = await ReadTextFile(BuildPath(ui_.DataFolder, "config\\user.css")) || "";
}

ReloadUserCss = async function () {
	if (!window.g_bCss || await confirmOk()) {
		ReadUserCss();
	}
}

EditUserCss = async function () {
	await SaveUserCss();
	MainWindow.InvokeCommand(BuildPath(ui_.DataFolder, "config\\user.css"), 0, ui_.hwnd, "Edit", null, null, SW_SHOWNORMAL, 0, 0, te, CMF_DEFAULTONLY);
}

SaveUserCss = async function () {
	if (window.g_bCss) {
		await WriteTextFile("config\\user.css", document.E.css.value.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n"));
	}
}

SaveLocation = SaveUserCss;
setTimeout(ReadUserCss, 99);
