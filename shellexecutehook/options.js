var clsid = "{E840AAD2-1EF2-4F00-8BA8-CE7B57BF8878}";
var reg = {};
var bit = api.sizeof("HANDLE") * 8;

var ado = OpenAdodbFromTextFile(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\" + Addon_Id + "\\options.html"));
if (ado) {
	SetTabContents(4, "General", ado.ReadText(adReadAll));
	ado.Close();
}

AddEventEx(window, "load", function ()
{
	try {
		document.getElementById("EnableShellExecuteHooks").checked = wsh.RegRead("HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\\EnableShellExecuteHooks");
	} catch (e) {}
	reg["EnableShellExecuteHooks"] = document.getElementById("EnableShellExecuteHooks").checked;
	try {
		var s =wsh.RegRead("HKCR\\CLSID\\" + clsid + "\\InprocServer32\\");
		reg[bit] = s ? 1 : 0;
		if (s) {
			var dllpath = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\shellexecutehook\\tshellexecutehook") + bit + ".dll";
			var dllpath1 = fso.BuildPath(system32, "tshellexecutehook" + bit + ".dll");
			var bUpdate;
			try {
				bUpdate = fso.GetFileVersion(dllpath) != fso.GetFileVersion(dllpath1);
			} catch (e) {
				bUpdate = true;
			}
			if (bUpdate) {
				document.getElementById("update" + bit).innerHTML = GetText('Update available');
			}
		}
	} catch (e) {}
	if (bit == 64) {
		try {
			var s = wsh.RegRead("HKCR\\Wow6432Node\\CLSID\\" + clsid + "\\InprocServer32\\");
			reg[32] = s ? 1 : 0;
			if (s) {
				dllpath = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\shellexecutehook\\tshellexecutehook32.dll");
				dllpath1 = fso.BuildPath(wsh.ExpandEnvironmentStrings("%WINDIR%\\SysWOW64"), "tshellexecutehook32.dll");
				var bUpdate;
				try {
					bUpdate = fso.GetFileVersion(dllpath) != fso.GetFileVersion(dllpath1);
				} catch (e) {
					bUpdate = true;
				}
				if (bUpdate) {
					document.getElementById("update32").innerHTML = GetText('Update available');
				}
			}
		} catch (e) {}
	} else {
		document.getElementById("Reg64bit").disabled = true;
		document.getElementById("Label64").style.color = "gray";
	}
	document.getElementById("Reg32bit").checked = reg[32];
	document.getElementById("Reg64bit").checked = reg[64];
	try {
		reg.Path = wsh.RegRead("HKCU\\SOFTWARE\\Tablacus\\ShellExecuteHook\\ExePath");
	} catch (e) {}
	document.getElementById("Path").value = reg.Path || "";

	ApplyLang(document);
});

SaveLocation = function ()
{
	if (g_bChanged) {
		var ex = te.Object();
		ex.EnableShellExecuteHooks = document.getElementById("EnableShellExecuteHooks").checked;
		ex.Path = document.getElementById("Path").value;
		ex[32] = document.getElementById("Reg32bit").checked;
		ex[64] = document.getElementById("Reg64bit").checked;
		OpenNewProcess("addons\\shellexecutehook\\worker.js", ex, false, WINVER >= 0x600 ? "RunAs" : null);
	}
}
