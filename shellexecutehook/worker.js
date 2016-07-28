importScripts("..\\..\\script\\consts.js");
var clsid = "{E840AAD2-1EF2-4F00-8BA8-CE7B57BF8878}";
var s, dllpath;
var bReboot = false;
if (MainWindow.Exchange) {
	var ex = MainWindow.Exchange[arg[3]];
	if (ex) {
		var reg = "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\\EnableShellExecuteHooks";
		try {
			s = wsh.RegRead(reg);
		} catch (e) {}
		if (s ^ ex.EnableShellExecuteHooks) {
			bReboot = true;
			try {
				if (ex.EnableShellExecuteHooks) {
					wsh.RegWrite(reg, 1, "REG_DWORD");
				} else {
					wsh.RegDelete(reg);
				}
			} catch (e) {}
		}
		reg = "HKCU\\SOFTWARE\\Tablacus\\ShellExecuteHook\\ExePath";
		try {
			s = wsh.RegRead(reg);
		} catch (e) {}
		if (s != ex.Path) {
			try {
				if (ex.Path) {
					wsh.RegWrite(reg, ex.Path, "REG_SZ");
				} else {
					wsh.RegDelete(reg);
					wsh.RegDelete("HKCU\\SOFTWARE\\Tablacus\\ShellExecuteHook\\");
					wsh.RegDelete("HKCU\\SOFTWARE\\Tablacus\\");
				}
			} catch (e) {}
		}
		var bit = api.sizeof("HANDLE") * 8;
		SetDll(bit, "", system32);
		if (bit == 64) {
			SetDll(32, "Wow6432Node\\", wsh.ExpandEnvironmentStrings("%WINDIR%\\SysWOW64"));
		}
		delete MainWindow.Exchange[arg[3]];
		if (bReboot) {
			api.MessageBox(null, api.LoadString(hShell32, 61961) || "Reboot required.", TITLE, MB_OK | MB_ICONEXCLAMATION);
		}
	}
}

function SetDll(bit, wow64, sysdir)
{
	var s = true;
	var dllpath = [];
	var ver = [];
	try {
		dllpath[2] = wsh.RegRead("HKCR\\" + wow64 + "CLSID\\" + clsid + "\\InprocServer32\\");
	} catch (e) {
		dllpath[2] = "";
		s = false;
	}
	if (ex[bit]) {
		dllpath[0] = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\shellexecutehook\\tshellexecutehook") + bit + ".dll";
		dllpath[1] = fso.BuildPath(sysdir, "tshellexecutehook" + bit + ".dll");
		for (var i = 2; i--;) {
			try {
				ver[i] = fso.GetFileVersion(dllpath[i]);
			} catch (e) {}
		}
		if (ver[0] != ver[1]) {
			try {
				fso.CopyFile(dllpath[0], dllpath[1]);
			} catch (e) {
				DeleteFileEx(dllpath[1]);
				fso.CopyFile(dllpath[0], dllpath[1]);
			}
			bReboot = true;
		}

		if (!s) {
			wsh.Run(api.PathQuoteSpaces(fso.BuildPath(sysdir, "regsvr32.exe")) + " /s " + api.PathQuoteSpaces(dllpath[1]));
			bReboot = true;
		}
	}
	if (!ex[bit] && s) {
		if (!dllpath[2] || !fso.FileExists(dllpath[2])) {
			dllpath[2] = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\shellexecutehook\\tshellexecutehook") + bit + ".dll";
			s = false;
		}
		if (dllpath[2] && fso.FileExists(dllpath[2])) {
			bReboot = true;
			wsh.Run(api.PathQuoteSpaces(fso.BuildPath(sysdir, "regsvr32.exe")) + " /u /s " + api.PathQuoteSpaces(dllpath[2]), 0, true);
			if (s) {
				try {
					fso.DeleteFile(dllpath[2], true);
				} catch (e) {
					DeleteFileEx(dllpath[2]);
				}
			}
		}
	}
}

function DeleteFileEx(path)
{
	try {
		var temp = fso.BuildPath(fso.GetParentFolderName(path), fso.GetTempName());
		fso.MoveFile(path, temp);
		api.MoveFileEx(temp, null, MOVEFILE_DELAY_UNTIL_REBOOT);
	} catch (e) {}
}
