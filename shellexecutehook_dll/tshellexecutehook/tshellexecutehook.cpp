// Tablacus Shel Execute Hook (C)2016 Gaku
// MIT Lisence
// Visual Studio Express 2017 for Windows Desktop
// 32-bit Visual Studio 2015 - Windows XP (v140_xp)
// 64-bit Visual Studio 2017 (v141)
// https://tablacus.github.io/

#include "tshellexecutehook.h"

const TCHAR g_szClsid[] = TEXT("{E840AAD2-1EF2-4F00-8BA8-CE7B57BF8878}");
const TCHAR g_szHandlerName[] = TEXT("Tablacus.ShellExecuteHook");

LONG      g_lLocks = 0;
HINSTANCE g_hinstDll = NULL;

// Function

VOID LockModule(BOOL bLock)
{
	if (bLock) {
		InterlockedIncrement(&g_lLocks);
	} else {
		InterlockedDecrement(&g_lLocks);
	}
}

LSTATUS CreateRegistryKey(HKEY hKeyRoot, LPTSTR lpszKey, LPTSTR lpszValue, LPTSTR lpszData)
{
	HKEY hKey;
	LSTATUS lr;

	lr = RegCreateKeyEx(hKeyRoot, lpszKey, 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hKey, NULL);
	if (lr == ERROR_SUCCESS) {
		lr = RegSetValueEx(hKey, lpszValue, 0, REG_SZ, (LPBYTE)lpszData, lpszData ? (lstrlen(lpszData) + 1) * sizeof(TCHAR) : 0);
		RegCloseKey(hKey);
	}
	return lr;
}

HRESULT ShowRegError(LSTATUS ls)
{
	LPTSTR lpBuffer = NULL;
	FormatMessage(FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_FROM_SYSTEM,  
		NULL, ls, LANG_USER_DEFAULT, (LPTSTR)&lpBuffer, 0, NULL);  
	MessageBox(NULL, lpBuffer, TEXT(PRODUCTNAME), MB_ICONHAND | MB_OK);  
	LocalFree(lpBuffer);
	return HRESULT_FROM_WIN32(ls);
}

HRESULT ExecuteTE(LPCTSTR lpParam, BOOL bCreateProcess)
{
	TCHAR szArg[32768];
	TCHAR szExe[MAX_PATH];
	TCHAR szHash[MAX_PATH];
	HKEY hKey;

	szExe[0] = NULL;
	if (RegOpenKeyEx(HKEY_CURRENT_USER, L"Software\\Tablacus\\ShellExecuteHook", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
		DWORD dwSize = sizeof(szExe);
		RegQueryValueEx(hKey, L"ExePath", NULL, NULL, (LPBYTE)&szExe, &dwSize);
		RegCloseKey(hKey);
		for (int i = 0; i < MAX_PATH; ++i) {
			WCHAR wc = towupper(szExe[i]);
			if (wc == '\\') {
				wc = '/';
			}
			szHash[i] = wc;
			if (!wc) {
				break;
			}
		}
		LONG_PTR nHash;
		HashData((BYTE *)szHash, lstrlen(szHash) * sizeof(WCHAR), (LPBYTE)&nHash, sizeof(LONG_PTR));
		HWND hwndTE = NULL;
		while (hwndTE = FindWindowEx(NULL, hwndTE, L"TablacusExplorer", NULL)) {
			if (GetWindowLongPtr(hwndTE, GWLP_USERDATA) == nHash) {
				for (int i = 1000; (GetWindowLong(hwndTE, GWL_EXSTYLE) & WS_EX_LAYERED) && --i;) {
					Sleep(500);
				}
				ExpandEnvironmentStrings(szExe, szArg, sizeof(szArg));
				if (!PathMatchSpec(szArg, L"\"*\"")) {
					PathQuoteSpaces(szArg);
				}
				if (lpParam) {
					lstrcat(szArg, L" ");
					lstrcat(szArg, lpParam);
				}
				COPYDATASTRUCT cd;
				cd.dwData = 0;
				cd.lpData = szArg;
				cd.cbData = (lstrlen(szArg) + 1) * sizeof(WCHAR);
				DWORD_PTR dwResult;
				LRESULT lResult = SendMessageTimeout(hwndTE, WM_COPYDATA, SW_SHOWNORMAL, LPARAM(&cd), SMTO_ABORTIFHUNG, 1000 * 30, &dwResult);
				if (lResult && dwResult == S_OK) {
					SetForegroundWindow(hwndTE);
					return S_OK;
				}
			}
		}
		if (bCreateProcess) {
			STARTUPINFO si = { sizeof(STARTUPINFO) };
			PROCESS_INFORMATION pi = { 0 };
			if (CreateProcess(szExe, NULL, NULL, NULL, FALSE, NORMAL_PRIORITY_CLASS, NULL, NULL, &si, &pi)) {
				if (lpParam) {
					WaitForInputIdle(pi.hProcess, 500);
					for (int i = 0; ExecuteTE(lpParam, FALSE) && i < 10; ++i) {
						Sleep(500);
					}
				}
				CloseHandle(pi.hThread);
				CloseHandle(pi.hProcess);
				return S_OK;
			}
		}
	}
	return S_FALSE;
}

HRESULT teGetDisplayNameBSTR(IShellFolder *pSF, PCUITEMID_CHILD pidl, SHGDNF uFlags, BSTR *pbs)
{
	STRRET strret;
	HRESULT hr = pSF->GetDisplayNameOf(pidl, uFlags, &strret);
	if SUCCEEDED(hr) {
		hr = StrRetToBSTR(&strret, pidl, pbs);
	}
	return hr;
}

// CShellExecuteHook

CShellExecuteHook::CShellExecuteHook()
{
	m_cRef = 1;
	LockModule(TRUE);
}

CShellExecuteHook::~CShellExecuteHook()
{
	LockModule(FALSE);
}

STDMETHODIMP CShellExecuteHook::QueryInterface(REFIID riid, void **ppvObject)
{
	*ppvObject = NULL;

	if (IsEqualIID(riid, IID_IUnknown) || IsEqualIID(riid, IID_IShellExecuteHook)) {
		*ppvObject = static_cast<IShellExecuteHook *>(this);
	} else {
		return E_NOINTERFACE;
	}
	AddRef();
	return S_OK;
}

STDMETHODIMP_(ULONG) CShellExecuteHook::AddRef()
{
	return InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CShellExecuteHook::Release()
{
	if (InterlockedDecrement(&m_cRef) == 0) {	
		delete this;
		return 0;
	}
	return m_cRef;
}

STDMETHODIMP CShellExecuteHook::Execute(LPSHELLEXECUTEINFO pei)
{
	TCHAR szExplorer[MAX_PATH];

	HRESULT hr = E_NOTIMPL;
	if (pei->lpVerb == NULL || PathMatchSpec(pei->lpVerb, L"opennewwindow;opennewprocess;explore;open")) {
		ExpandEnvironmentStrings(L"%windir%\\explorer.exe", szExplorer, MAX_PATH);
		if (pei->fMask & (SEE_MASK_IDLIST | SEE_MASK_INVOKEIDLIST)) {
			try {
				IShellFolder *pSF;
				LPCITEMIDLIST pidlPart;
				BSTR bs;
				if SUCCEEDED(SHBindToParent((LPCITEMIDLIST)pei->lpIDList, IID_PPV_ARGS(&pSF), &pidlPart)) {
					if SUCCEEDED(teGetDisplayNameBSTR(pSF, pidlPart, SHGDN_FORPARSING, &bs)) {
						if (lstrcmpi(bs, szExplorer) == 0) {
							hr = ExecuteTE(pei->lpParameters, TRUE);
						} else {
							SFGAOF sfAttr = SFGAO_FOLDER | SFGAO_FILESYSTEM;
							if FAILED(pSF->GetAttributesOf(1, &pidlPart, &sfAttr)) {
								sfAttr = 0;
							}
							if ((sfAttr & (SFGAO_FOLDER | SFGAO_FILESYSTEM)) == (SFGAO_FOLDER | SFGAO_FILESYSTEM)) {
								hr = ExecuteTE(bs, TRUE);
							} else if (!PathMatchSpec(bs, FILTER_CONTROLPANEL)) {
								if (sfAttr & SFGAO_FOLDER) { 
									hr = ExecuteTE(bs, TRUE);
								} else if (PathMatchSpec(bs, FILTER_WINE10)) {
									hr = ExecuteTE(NULL, TRUE);
								}
							}
						}
						::SysFreeString(bs);
					}
					pSF->Release();
				}
			} catch (...) {
				return S_FALSE;
			}
		}
		if (hr == E_NOTIMPL && pei->lpFile) {
			try {
				if (lstrcmpi(pei->lpFile, szExplorer) == 0) {
					hr = ExecuteTE(pei->lpParameters, TRUE);
				} else if (PathMatchSpec(pei->lpFile, FILTER_WINE10)) {
					hr = ExecuteTE(pei->lpFile, TRUE);
				} else if (PathIsDirectory(pei->lpFile)) {
					hr = ExecuteTE(pei->lpFile, TRUE);
				}
			} catch (...) {
				return S_FALSE;
			}
		}
	}
	return hr == S_OK ? S_OK : S_FALSE;
}


// CClassFactory


STDMETHODIMP CClassFactory::QueryInterface(REFIID riid, void **ppvObject)
{
	*ppvObject = NULL;

	if (IsEqualIID(riid, IID_IUnknown) || IsEqualIID(riid, IID_IClassFactory)) {
		*ppvObject = static_cast<IClassFactory *>(this);
	} else {
		return E_NOINTERFACE;
	}
	AddRef();
	return S_OK;
}

STDMETHODIMP_(ULONG) CClassFactory::AddRef()
{
	LockModule(TRUE);
	return 2;
}

STDMETHODIMP_(ULONG) CClassFactory::Release()
{
	LockModule(FALSE);
	return 1;
}

STDMETHODIMP CClassFactory::CreateInstance(IUnknown *pUnkOuter, REFIID riid, void **ppvObject)
{
	CShellExecuteHook *p;
	HRESULT           hr;
	
	*ppvObject = NULL;
	if (pUnkOuter) {
		return CLASS_E_NOAGGREGATION;
	}
	p = new CShellExecuteHook();
	if (p == NULL) {
		return E_OUTOFMEMORY;
	}
	hr = p->QueryInterface(riid, ppvObject);
	p->Release();
	return hr;
}

STDMETHODIMP CClassFactory::LockServer(BOOL fLock)
{
	LockModule(fLock);
	return S_OK;
}


// DLL Export


STDAPI DllCanUnloadNow()
{
	return g_lLocks == 0 ? S_OK : S_FALSE;
}

STDAPI DllGetClassObject(REFCLSID rclsid, REFIID riid, LPVOID *ppv)
{
	static CClassFactory serverFactory;
	CLSID clsid;

	*ppv = NULL;
	return SUCCEEDED(CLSIDFromString(g_szClsid, &clsid)) && IsEqualCLSID(rclsid, clsid) ?
		serverFactory.QueryInterface(riid, ppv) : CLASS_E_CLASSNOTAVAILABLE;
}

STDAPI DllRegisterServer(void)
{
	TCHAR szModulePath[MAX_PATH];
	TCHAR szKey[256];

	wsprintf(szKey, TEXT("CLSID\\%s"), g_szClsid);
	LSTATUS lr = CreateRegistryKey(HKEY_CLASSES_ROOT, szKey, NULL, (LPTSTR)g_szHandlerName);
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	GetModuleFileName(g_hinstDll, szModulePath, sizeof(szModulePath) / sizeof(TCHAR));
	wsprintf(szKey, TEXT("CLSID\\%s\\InprocServer32"), g_szClsid);
	lr = CreateRegistryKey(HKEY_CLASSES_ROOT, szKey, NULL, szModulePath);
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	lr = CreateRegistryKey(HKEY_CLASSES_ROOT, szKey, TEXT("ThreadingModel"), TEXT("Apartment"));
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	wsprintf(szKey, TEXT("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\explorer\\ShellExecuteHooks"));
	lr = CreateRegistryKey(HKEY_LOCAL_MACHINE, szKey, (LPTSTR)g_szClsid, (LPTSTR)g_szHandlerName);
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	return S_OK;
}

STDAPI DllUnregisterServer(void)
{
	TCHAR szKey[256];

	wsprintf(szKey, TEXT("CLSID\\%s"), g_szClsid);
	SHDeleteKey(HKEY_CLASSES_ROOT, szKey);
	SHDeleteValue(HKEY_LOCAL_MACHINE, TEXT("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\explorer\\ShellExecuteHooks"), (LPTSTR)g_szClsid);
	return S_OK;
}

BOOL WINAPI DllMain(HINSTANCE hinstDll, DWORD dwReason, LPVOID lpReserved)
{
	switch (dwReason) {

	case DLL_PROCESS_ATTACH:
		g_hinstDll = hinstDll;
		DisableThreadLibraryCalls(hinstDll);
		return TRUE;
	}
	return TRUE;
}
