const clsid = "{E840AAD2-1EF2-4F00-8BA8-CE7B57BF8878}";
const reg = {};

SetTabContents(4, "General", await ReadTextFile(BuildPath("addons", Addon_Id, "options.html")));
setTimeout(async function () {
	let bHook = false;
	try {
		bHook = await wsh.RegRead("HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\\EnableShellExecuteHooks");
	} catch (e) {
		bHook = false;
	}
	document.getElementById("EnableShellExecuteHooks").checked = bHook;
	reg["EnableShellExecuteHooks"] = bHook;
	let s;
	try {
		s = await wsh.RegRead("HKCR\\CLSID\\" + clsid + "\\InprocServer32\\");
	} catch (e) { }
	reg[ui_.bit] = s ? 1 : 0;
	if (s) {
		const dllpath = BuildPath(ui_.Installed, "addons\\shellexecutehook\\tshellexecutehook") + ui_.bit + ".dll";
		const dllpath1 = BuildPath(system32, "tshellexecutehook" + ui_.bit + ".dll");
		let bUpdate;
		try {
			bUpdate = await fso.GetFileVersion(dllpath) != await fso.GetFileVersion(dllpath1);
		} catch (e) {
			bUpdate = true;
		}
		if (bUpdate) {
			document.getElementById("update" + ui_.bit).innerHTML = await GetText('Update available');
		}
	}
	if (ui_.bit == 64) {
		try {
			s = await wsh.RegRead("HKCR\\Wow6432Node\\CLSID\\" + clsid + "\\InprocServer32\\");
		} catch (e) { }
		reg[32] = s ? 1 : 0;
		if (s) {
			const dllpath = BuildPath(ui_.Installed, "addons\\shellexecutehook\\tshellexecutehook32.dll");
			const dllpath1 = BuildPath(await wsh.ExpandEnvironmentStrings("%WINDIR%\\SysWOW64"), "tshellexecutehook32.dll");
			let bUpdate;
			try {
				bUpdate = await fso.GetFileVersion(dllpath) != await fso.GetFileVersion(dllpath1);
			} catch (e) {
				bUpdate = true;
			}
			if (bUpdate) {
				document.getElementById("update32").innerHTML = await GetText('Update available');
			}
		}
	} else {
		document.getElementById("Reg64bit").disabled = true;
		document.getElementById("Label64").style.color = "gray";
	}
	document.getElementById("Reg32bit").checked = reg[32];
	document.getElementById("Reg64bit").checked = reg[64];
	try {
		reg.Path = await wsh.RegRead("HKCU\\SOFTWARE\\Tablacus\\ShellExecuteHook\\ExePath");
	} catch (e) { }
	document.getElementById("Path").value = reg.Path || "";
}, 99);

SaveLocation = async function () {
	if (g_bChanged) {
		const db = await CreateSync("BasicDB", BuildPath(await GetTempPath(1), "shellexecutehook"));
		await db.Set("EnableShellExecuteHooks", GetNum(document.getElementById("EnableShellExecuteHooks").checked));
		await db.Set("Path", document.getElementById("Path").value);
		await db.Set("32", GetNum(document.getElementById("Reg32bit").checked));
		await db.Set("64", GetNum(document.getElementById("Reg64bit").checked));
		await db.Set("Explorer", GetNum(document.getElementById("Explorer").checked));
		await db.Save();
		await ShellExecute([PathQuoteSpaces(await api.GetModuleFileName(null)), '/run', "addons\\shellexecutehook\\worker.js"].join(" "), WINVER >= 0x600 ? "RunAs" : null, SW_SHOWNOACTIVATE);
	}
}
