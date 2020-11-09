var clsid = "{E840AAD2-1EF2-4F00-8BA8-CE7B57BF8878}";
var reg = {};
var bit = await api.sizeof("HANDLE") * 8;

SetTabContents(4, "General", await ReadTextFile(BuildPath("addons", Addon_Id, "options.html")));
setTimeout(async function () {
	var bHook = false;
	try {
		bHook = await wsh.RegRead("HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\\EnableShellExecuteHooks");
	} catch (e) {
		bHook = false;
	}
	document.getElementById("EnableShellExecuteHooks").checked = bHook;
	reg["EnableShellExecuteHooks"] = bHook;
	try {
		var s = await wsh.RegRead("HKCR\\CLSID\\" + clsid + "\\InprocServer32\\");
		reg[bit] = s ? 1 : 0;
		if (s) {
			var dllpath = BuildPath(GetParentFolderName(await api.GetModuleFileName(null)), "addons\\shellexecutehook\\tshellexecutehook") + bit + ".dll";
			var dllpath1 = BuildPath(system32, "tshellexecutehook" + bit + ".dll");
			var bUpdate;
			try {
				bUpdate = await fso.GetFileVersion(dllpath) != await fso.GetFileVersion(dllpath1);
			} catch (e) {
				bUpdate = true;
			}
			if (bUpdate) {
				document.getElementById("update" + bit).innerHTML = await GetText('Update available');
			}
		}
	} catch (e) { }
	if (bit == 64) {
		try {
			var s = await wsh.RegRead("HKCR\\Wow6432Node\\CLSID\\" + clsid + "\\InprocServer32\\");
			reg[32] = s ? 1 : 0;
			if (s) {
				dllpath = BuildPath(GetParentFolderName(await api.GetModuleFileName(null)), "addons\\shellexecutehook\\tshellexecutehook32.dll");
				dllpath1 = BuildPath(await wsh.ExpandEnvironmentStrings("%WINDIR%\\SysWOW64"), "tshellexecutehook32.dll");
				var bUpdate;
				try {
					bUpdate = await fso.GetFileVersion(dllpath) != await fso.GetFileVersion(dllpath1);
				} catch (e) {
					bUpdate = true;
				}
				if (bUpdate) {
					document.getElementById("update32").innerHTML = await GetText('Update available');
				}
			}
		} catch (e) { }
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
		var ex = await api.CreateObject("Object");
		ex.EnableShellExecuteHooks = document.getElementById("EnableShellExecuteHooks").checked;
		ex.Path = document.getElementById("Path").value;
		ex[32] = document.getElementById("Reg32bit").checked;
		ex[64] = document.getElementById("Reg64bit").checked;
		ex.Explorer = document.getElementById("Explorer").checked;
		MainWindow.OpenNewProcess("addons\\shellexecutehook\\worker.js", ex, false, WINVER >= 0x600 ? "RunAs" : null);
	}
}
