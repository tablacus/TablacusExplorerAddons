// Tablacus Susie Plug-in Wrapper (C)2017 Gaku
// MIT Lisence
// Visual Studio Express 2017 for Windows Desktop
// 32-bit Visual Studio 2015 - Windows XP (v140_xp)
// 64-bit Visual Studio 2017 (v141)
// https://tablacus.github.io/

#include "tsqlite.h"

// Global Variables:
const TCHAR g_szProgid[] = TEXT("Tablacus.SQLite3");
const TCHAR g_szClsid[] = TEXT("{CAC858A3-6D0C-4E03-A609-880C7F04BBDA}");
HINSTANCE	g_hinstDll = NULL;
LONG		g_lLocks = 0;
CteBase		*g_pBase = NULL;
std::vector <CteSQLite*> g_ppObject;
IDispatch	*g_pdispProgressProc = NULL;

std::unordered_map<std::wstring, DISPID> g_umBASE = {
	{ L"open", 0x60010000 },
	{ L"close", 0x6001000C },
};

std::unordered_map<std::wstring, DISPID> g_umTSPI = {
	{ L"sqlite3_open", 0x60010001 },
	{ L"sqlite3_close", 0x60010002 },
	{ L"sqlite3_exec", 0x60010003 },
};

// Unit
VOID SafeRelease(PVOID ppObj)
{
	try {
		IUnknown **ppunk = static_cast<IUnknown **>(ppObj);
		if (*ppunk) {
			(*ppunk)->Release();
			*ppunk = NULL;
		}
	} catch (...) {}
}

void LockModule(BOOL bLock)
{
	if (bLock) {
		InterlockedIncrement(&g_lLocks);
	} else {
		InterlockedDecrement(&g_lLocks);
	}
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

LSTATUS CreateRegistryKey(HKEY hKeyRoot, LPTSTR lpszKey, LPTSTR lpszValue, LPTSTR lpszData)
{
	HKEY  hKey;
	LSTATUS  lr;
	DWORD dwSize;

	lr = RegCreateKeyEx(hKeyRoot, lpszKey, 0, NULL, REG_OPTION_NON_VOLATILE, KEY_WRITE, NULL, &hKey, NULL);
	if (lr == ERROR_SUCCESS) {
		if (lpszData != NULL) {
			dwSize = (lstrlen(lpszData) + 1) * sizeof(TCHAR);
		} else {
			dwSize = 0;
		}
		lr = RegSetValueEx(hKey, lpszValue, 0, REG_SZ, (LPBYTE)lpszData, dwSize);
		RegCloseKey(hKey);
	}
	return lr;
}

BSTR GetLPWSTRFromVariant(VARIANT *pv)
{
	switch (pv->vt) {
		case VT_VARIANT | VT_BYREF:
			return GetLPWSTRFromVariant(pv->pvarVal);
		case VT_BSTR:
		case VT_LPWSTR:
			return pv->bstrVal;
		default:
			return NULL;
	}//end_switch
}

int GetIntFromVariant(VARIANT *pv)
{
	if (pv) {
		if (pv->vt == (VT_VARIANT | VT_BYREF)) {
			return GetIntFromVariant(pv->pvarVal);
		}
		if (pv->vt == VT_I4) {
			return pv->lVal;
		}
		if (pv->vt == VT_UI4) {
			return pv->ulVal;
		}
		if (pv->vt == VT_R8) {
			return (int)(LONGLONG)pv->dblVal;
		}
		VARIANT vo;
		VariantInit(&vo);
		if SUCCEEDED(VariantChangeType(&vo, pv, 0, VT_I4)) {
			return vo.lVal;
		}
		if SUCCEEDED(VariantChangeType(&vo, pv, 0, VT_UI4)) {
			return vo.ulVal;
		}
		if SUCCEEDED(VariantChangeType(&vo, pv, 0, VT_I8)) {
			return (int)vo.llVal;
		}
	}
	return 0;
}

int GetIntFromVariantClear(VARIANT *pv)
{
	int i = GetIntFromVariant(pv);
	VariantClear(pv);
	return i;
}

#ifdef _WIN64
BOOL teStartsText(LPWSTR pszSub, LPCWSTR pszFile)
{
	BOOL bResult = pszFile ? TRUE : FALSE;
	WCHAR wc;
	while (bResult && (wc = *pszSub++)) {
		bResult = towlower(wc) == towlower(*pszFile++);
	}
	return bResult;
}

BOOL teVarIsNumber(VARIANT *pv) {
	return pv->vt == VT_I4 || pv->vt == VT_R8 || pv->vt == (VT_ARRAY | VT_I4) || (pv->vt == VT_BSTR && ::SysStringLen(pv->bstrVal) == 18 && teStartsText(L"0x", pv->bstrVal));
}

BOOL GetLLFromVariant2(LONGLONG *pll, VARIANT *pv) {
	if (pv->vt == VT_I4) {
		*pll = pv->lVal;
		return TRUE;
	}
	if (pv->vt == VT_R8) {
		*pll = (LONGLONG)pv->dblVal;
		return TRUE;
	}
	if (pv->vt == (VT_ARRAY | VT_I4)) {
		LONGLONG ll = 0;
		PVOID pvData;
		if (::SafeArrayAccessData(pv->parray, &pvData) == S_OK) {
			::CopyMemory(&ll, pvData, sizeof(LONGLONG));
			::SafeArrayUnaccessData(pv->parray);
			return ll;
		}
	}
	if (teVarIsNumber(pv)) {
		if (swscanf_s(pv->bstrVal, L"0x%016llx", pll) > 0) {
			return TRUE;
		}
	}
	return FALSE;
}

LONGLONG GetLLFromVariant(VARIANT *pv)
{
	if (pv) {
		if (pv->vt == (VT_VARIANT | VT_BYREF)) {
			return GetLLFromVariant(pv->pvarVal);
		}
		LONGLONG ll = 0;
		if (GetLLFromVariant2(&ll, pv)) {
			return ll;
		}
		if (pv->vt != VT_DISPATCH) {
			VARIANT vo;
			VariantInit(&vo);
			if SUCCEEDED(VariantChangeType(&vo, pv, 0, VT_I8)) {
				return vo.llVal;
			}
		}
	}
	return 0;
}
#endif

VOID teSetBool(VARIANT *pv, BOOL b)
{
	if (pv) {
		pv->boolVal = b ? VARIANT_TRUE : VARIANT_FALSE;
		pv->vt = VT_BOOL;
	}
}

VOID teSysFreeString(BSTR *pbs)
{
	if (*pbs) {
		::SysFreeString(*pbs);
		*pbs = NULL;
	}
}

VOID teSetLong(VARIANT *pv, LONG i)
{
	if (pv) {
		pv->lVal = i;
		pv->vt = VT_I4;
	}
}

VOID teSetLL(VARIANT *pv, LONGLONG ll)
{
	if (pv) {
		pv->lVal = static_cast<int>(ll);
		if (ll == static_cast<LONGLONG>(pv->lVal)) {
			pv->vt = VT_I4;
			return;
		}
		pv->dblVal = static_cast<DOUBLE>(ll);
		if (ll == static_cast<LONGLONG>(pv->dblVal)) {
			pv->vt = VT_R8;
			return;
		}
		SAFEARRAY *psa;
		psa = SafeArrayCreateVector(VT_I4, 0, sizeof(LONGLONG) / sizeof(int));
		if (psa) {
			PVOID pvData;
			if (::SafeArrayAccessData(psa, &pvData) == S_OK) {
				::CopyMemory(pvData, &ll, sizeof(LONGLONG));
				::SafeArrayUnaccessData(psa);
				pv->vt = VT_ARRAY | VT_I4;
				pv->parray = psa;
			}
		}
	}
}

BOOL teSetObject(VARIANT *pv, PVOID pObj)
{
	if (pObj) {
		try {
			IUnknown *punk = static_cast<IUnknown *>(pObj);
			if SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(&pv->pdispVal))) {
				pv->vt = VT_DISPATCH;
				return true;
			}
			if SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(&pv->punkVal))) {
				pv->vt = VT_UNKNOWN;
				return true;
			}
		} catch (...) {}
	}
	return false;
}

BOOL teSetObjectRelease(VARIANT *pv, PVOID pObj)
{
	if (pObj) {
		try {
			IUnknown *punk = static_cast<IUnknown *>(pObj);
			if (pv) {
				if SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(&pv->pdispVal))) {
					pv->vt = VT_DISPATCH;
					SafeRelease(&punk);
					return true;
				}
				if SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(&pv->punkVal))) {
					pv->vt = VT_UNKNOWN;
					SafeRelease(&punk);
					return true;
				}
			}
			SafeRelease(&punk);
		} catch (...) {}
	}
	return false;
}

VOID teSetSZA(VARIANT *pv, LPCSTR lpstr, int nCP)
{
	if (pv) {
		int nLenW = MultiByteToWideChar(nCP, 0, lpstr, -1, NULL, NULL);
		if (nLenW) {
			pv->bstrVal = ::SysAllocStringLen(NULL, nLenW - 1);
			pv->bstrVal[0] = NULL;
			MultiByteToWideChar(nCP, 0, (LPCSTR)lpstr, -1, pv->bstrVal, nLenW);
		} else {
			pv->bstrVal = NULL;
		}
		pv->vt = VT_BSTR;
	}
}

VOID teSetSZ(VARIANT *pv, LPCWSTR lpstr)
{
	if (pv) {
		pv->bstrVal = ::SysAllocString(lpstr);
		pv->vt = VT_BSTR;
	}
}

VOID teSetBSTR(VARIANT *pv, BSTR bs, int nLen)
{
	if (pv) {
		pv->vt = VT_BSTR;
		if (bs) {
			if (nLen < 0) {
				nLen = lstrlen(bs);
			}
			if (::SysStringLen(bs) == nLen) {
				pv->bstrVal = bs;
				return;
			}
		}
		pv->bstrVal = SysAllocStringLen(bs, nLen);
		teSysFreeString(&bs);
	}
}

BOOL FindUnknown(VARIANT *pv, IUnknown **ppunk)
{
	if (pv) {
		if (pv->vt == VT_DISPATCH || pv->vt == VT_UNKNOWN) {
			*ppunk = pv->punkVal;
			return *ppunk != NULL;
		}
		if (pv->vt == (VT_VARIANT | VT_BYREF)) {
			return FindUnknown(pv->pvarVal, ppunk);
		}
		if (pv->vt == (VT_DISPATCH | VT_BYREF) || pv->vt == (VT_UNKNOWN | VT_BYREF)) {
			*ppunk = *pv->ppunkVal;
			return *ppunk != NULL;
		}
	}
	*ppunk = NULL;
	return false;
}

BSTR GetMemoryFromVariant(VARIANT *pv, BOOL *pbDelete, LONG_PTR *pLen)
{
	if (pv->vt == (VT_VARIANT | VT_BYREF)) {
		return GetMemoryFromVariant(pv->pvarVal, pbDelete, pLen);
	}
	BSTR pMemory = NULL;
	*pbDelete = FALSE;
	if (pLen) {
		if (pv->vt == VT_BSTR || pv->vt == VT_LPWSTR) {
			return pv->bstrVal;
		}
	}
	IUnknown *punk;
	if (FindUnknown(pv, &punk)) {
		IStream *pStream;
		if SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(&pStream))) {
			ULARGE_INTEGER uliSize;
			if (pLen) {
				LARGE_INTEGER liOffset;
				liOffset.QuadPart = 0;
				pStream->Seek(liOffset, STREAM_SEEK_END, &uliSize);
				pStream->Seek(liOffset, STREAM_SEEK_SET, NULL);
			} else {
				uliSize.QuadPart = 2048;
			}
			pMemory = ::SysAllocStringByteLen(NULL, uliSize.LowPart > 2048 ? uliSize.LowPart : 2048);
			if (pMemory) {
				if (uliSize.LowPart < 2048) {
					::ZeroMemory(pMemory, 2048);
				}
				*pbDelete = TRUE;
				ULONG cbRead;
				pStream->Read(pMemory, uliSize.LowPart, &cbRead);
				if (pLen) {
					*pLen = cbRead;
				}
			}
			pStream->Release();
		}
	} else if (pv->vt == (VT_ARRAY | VT_I1) || pv->vt == (VT_ARRAY | VT_UI1) || pv->vt == (VT_ARRAY | VT_I1 | VT_BYREF) || pv->vt == (VT_ARRAY | VT_UI1 | VT_BYREF)) {
		LONG lUBound, lLBound, nSize;
		SAFEARRAY *psa = (pv->vt & VT_BYREF) ? pv->pparray[0] : pv->parray;
		PVOID pvData;
		if (::SafeArrayAccessData(psa, &pvData) == S_OK) {
			SafeArrayGetUBound(psa, 1, &lUBound);
			SafeArrayGetLBound(psa, 1, &lLBound);
			nSize = lUBound - lLBound + 1;
			pMemory = ::SysAllocStringByteLen(NULL, nSize > 2048 ? nSize : 2048);
			if (pMemory) {
				if (nSize < 2048) {
					::ZeroMemory(pMemory, 2048);
				}
				::CopyMemory(pMemory, pvData, nSize);
				if (pLen) {
					*pLen = nSize;
				}
				*pbDelete = TRUE;
			}
			::SafeArrayUnaccessData(psa);
		}
		return pMemory;
	} else if (!pLen) {
		return (BSTR)GetPtrFromVariant(pv);
	}
	return pMemory;
}

HRESULT tePutProperty0(IUnknown *punk, LPOLESTR sz, VARIANT *pv, DWORD grfdex)
{
	HRESULT hr = E_FAIL;
	DISPID dispid, putid;
	DISPPARAMS dispparams;
	IDispatchEx *pdex;
	if SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(&pdex))) {
		BSTR bs = ::SysAllocString(sz);
		hr = pdex->GetDispID(bs, grfdex, &dispid);
		if SUCCEEDED(hr) {
			putid = DISPID_PROPERTYPUT;
			dispparams.rgvarg = pv;
			dispparams.rgdispidNamedArgs = &putid;
			dispparams.cArgs = 1;
			dispparams.cNamedArgs = 1;
			hr = pdex->InvokeEx(dispid, LOCALE_USER_DEFAULT, DISPATCH_PROPERTYPUTREF, &dispparams, NULL, NULL, NULL);
		}
		::SysFreeString(bs);
		SafeRelease(&pdex);
	}
	return hr;
}

HRESULT tePutProperty(IUnknown *punk, LPOLESTR sz, VARIANT *pv)
{
	return tePutProperty0(punk, sz, pv, fdexNameEnsure);
}

// VARIANT Clean-up of an array
VOID teClearVariantArgs(int nArgs, VARIANTARG *pvArgs)
{
	if (pvArgs && nArgs > 0) {
		for (int i = nArgs ; i-- >  0;){
			VariantClear(&pvArgs[i]);
		}
		delete[] pvArgs;
		pvArgs = NULL;
	}
}

HRESULT Invoke5(IDispatch *pdisp, DISPID dispid, WORD wFlags, VARIANT *pvResult, int nArgs, VARIANTARG *pvArgs)
{
	HRESULT hr;
	// DISPPARAMS
	DISPPARAMS dispParams;
	dispParams.rgvarg = pvArgs;
	dispParams.cArgs = abs(nArgs);
	DISPID dispidName = DISPID_PROPERTYPUT;
	if (wFlags & DISPATCH_PROPERTYPUT) {
		dispParams.cNamedArgs = 1;
		dispParams.rgdispidNamedArgs = &dispidName;
	} else {
		dispParams.rgdispidNamedArgs = NULL;
		dispParams.cNamedArgs = 0;
	}
	try {
		hr = pdisp->Invoke(dispid, IID_NULL, LOCALE_USER_DEFAULT,
			wFlags, &dispParams, pvResult, NULL, NULL);
	} catch (...) {
		hr = E_FAIL;
	}
	teClearVariantArgs(nArgs, pvArgs);
	return hr;
}

HRESULT Invoke4(IDispatch *pdisp, VARIANT *pvResult, int nArgs, VARIANTARG *pvArgs)
{
	return Invoke5(pdisp, DISPID_VALUE, DISPATCH_METHOD, pvResult, nArgs, pvArgs);
}

VARIANTARG* GetNewVARIANT(int n)
{
	VARIANT *pv = new VARIANTARG[n];
	while (n--) {
		VariantInit(&pv[n]);
	}
	return pv;
}

BOOL teFileTimeToVariantTime(LPFILETIME pft, DOUBLE *pdt)
{
	FILETIME ft;
	if (::FileTimeToLocalFileTime(pft, &ft)) {
		SYSTEMTIME SysTime;
		if (::FileTimeToSystemTime(&ft, &SysTime)) {
			return ::SystemTimeToVariantTime(&SysTime, pdt);
		}
	}
	return FALSE;
}

BOOL GetDispatch(VARIANT *pv, IDispatch **ppdisp)
{
	IUnknown *punk;
	if (FindUnknown(pv, &punk)) {
		return SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(ppdisp)));
	}
	return FALSE;
}

HRESULT teGetProperty(IDispatch *pdisp, LPOLESTR sz, VARIANT *pv)
{
	DISPID dispid;
	HRESULT hr = pdisp->GetIDsOfNames(IID_NULL, &sz, 1, LOCALE_USER_DEFAULT, &dispid);
	if (hr == S_OK) {
		hr = Invoke5(pdisp, dispid, DISPATCH_PROPERTYGET, pv, 0, NULL);
	}
	return hr;
}

VOID teVariantChangeType(__out VARIANTARG * pvargDest,
				__in const VARIANTARG * pvarSrc, __in VARTYPE vt)
{
	VariantInit(pvargDest);
	if FAILED(VariantChangeType(pvargDest, pvarSrc, 0, vt)) {
		pvargDest->llVal = 0;
	}
}

LPSTR teWide2Ansi(LPWSTR lpW, int nLenW, int nCP)
{
	int nLenA = WideCharToMultiByte(nCP, 0, (LPCWSTR)lpW, nLenW, NULL, 0, NULL, NULL);
	BSTR bs = ::SysAllocStringByteLen(NULL, nLenA);
	WideCharToMultiByte(nCP, 0, (LPCWSTR)lpW, nLenW, (LPSTR)bs, nLenA, NULL, NULL);
	return (LPSTR)bs;
}

VOID teFreeAnsiString(LPSTR *lplpA)
{
	::SysFreeString((BSTR)*lplpA);
	*lplpA = NULL;
}

HRESULT teExecMethod(IDispatch *pdisp, LPOLESTR sz, VARIANT *pvResult, int nArg, VARIANTARG *pvArgs)
{
	DISPID dispid;
	HRESULT hr = pdisp->GetIDsOfNames(IID_NULL, &sz, 1, LOCALE_USER_DEFAULT, &dispid);
	if (hr == S_OK) {
		return Invoke5(pdisp, dispid, DISPATCH_METHOD, pvResult, nArg, pvArgs);
	}
	teClearVariantArgs(nArg, pvArgs);
	return hr;
}

// Initialize & Finalize
BOOL WINAPI DllMain(HINSTANCE hinstDll, DWORD dwReason, LPVOID lpReserved)
{
	switch (dwReason) {
		case DLL_PROCESS_ATTACH:
			g_pBase = new CteBase();
			g_hinstDll = hinstDll;
			break;
		case DLL_PROCESS_DETACH:
			for (size_t i = g_ppObject.size(); i--;) {
				SafeRelease(&g_ppObject[i]);
			}
			g_ppObject.clear();
			SafeRelease(&g_pBase);
			SafeRelease(&g_pdispProgressProc);
			break;
	}
	return TRUE;
}

// DLL Export

STDAPI DllCanUnloadNow(void)
{
	return g_lLocks == 0 ? S_OK : S_FALSE;
}

STDAPI DllGetClassObject(REFCLSID rclsid, REFIID riid, LPVOID *ppv)
{
	static CteClassFactory serverFactory;
	CLSID clsid;
	HRESULT hr = CLASS_E_CLASSNOTAVAILABLE;

	*ppv = NULL;
	CLSIDFromString(g_szClsid, &clsid);
	if (IsEqualCLSID(rclsid, clsid)) {
		hr = serverFactory.QueryInterface(riid, ppv);
	}
	return hr;
}

STDAPI DllRegisterServer(void)
{
	TCHAR szModulePath[MAX_PATH];
	TCHAR szKey[256];

	wsprintf(szKey, TEXT("CLSID\\%s"), g_szClsid);
	LSTATUS lr = CreateRegistryKey(HKEY_CLASSES_ROOT, szKey, NULL, const_cast<LPTSTR>(g_szProgid));
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	GetModuleFileName(g_hinstDll, szModulePath, ARRAYSIZE(szModulePath));
	wsprintf(szKey, TEXT("CLSID\\%s\\InprocServer32"), g_szClsid);
	lr = CreateRegistryKey(HKEY_CLASSES_ROOT, szKey, NULL, szModulePath);
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	lr = CreateRegistryKey(HKEY_CLASSES_ROOT, szKey, TEXT("ThreadingModel"), TEXT("Apartment"));
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	wsprintf(szKey, TEXT("CLSID\\%s\\ProgID"), g_szClsid);
	lr = CreateRegistryKey(HKEY_CLASSES_ROOT, szKey, NULL, const_cast<LPTSTR>(g_szProgid));
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	lr = CreateRegistryKey(HKEY_CLASSES_ROOT, const_cast<LPTSTR>(g_szProgid), NULL, TEXT(PRODUCTNAME));
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	wsprintf(szKey, TEXT("%s\\CLSID"), g_szProgid);
	lr = CreateRegistryKey(HKEY_CLASSES_ROOT, szKey, NULL, const_cast<LPTSTR>(g_szClsid));
	if (lr != ERROR_SUCCESS) {
		return ShowRegError(lr);
	}
	return S_OK;
}

STDAPI DllUnregisterServer(void)
{
	TCHAR szKey[64];
	wsprintf(szKey, TEXT("CLSID\\%s"), g_szClsid);
	LSTATUS ls = SHDeleteKey(HKEY_CLASSES_ROOT, szKey);
	if (ls == ERROR_SUCCESS) {
		ls = SHDeleteKey(HKEY_CLASSES_ROOT, g_szProgid);
		if (ls == ERROR_SUCCESS) {
			return S_OK;
		}
	}
	return ShowRegError(ls);
}

int __cdecl sqlite3_callback(void *pArg, int argc, char **argv, char **columnNames)
{
	int iResult = SQLITE_OK;
	TECallback *pcb = (TECallback *)pArg;
	if (pcb->punkCallback && pcb->punkDB) {
		VARIANT vDB, vColumn, vArgv, vResult;
		VariantInit(&vDB);
		IDispatch *pdisp;
		if SUCCEEDED(pcb->punkDB->QueryInterface(IID_PPV_ARGS(&pdisp))) {
			LPVARIANTARG pv = GetNewVARIANT(1);
			teSetSZ(pv, L"Object");
			Invoke4(pdisp, &vDB, 1, pv);
			pdisp->Release();
		}
		IUnknown *punk;
		if (FindUnknown(&vDB, &punk)) {
			VariantInit(&vColumn);
			VariantInit(&vArgv);
			for (int i = argc; i--;) {
				teSetSZA(&vColumn, columnNames[i], CP_UTF8);
				teSetSZA(&vArgv, argv[i], CP_UTF8);
				tePutProperty(punk, vColumn.bstrVal, &vArgv);
				VariantClear(&vArgv);
				VariantClear(&vColumn);
			}
		}
		if SUCCEEDED(pcb->punkCallback->QueryInterface(IID_PPV_ARGS(&pdisp))) {
			VARIANTARG *pv = GetNewVARIANT(1);
			VariantCopy(&pv[0], &vDB);
			VariantInit(&vResult);
			Invoke4(pdisp, &vResult, 1, pv);
			pdisp->Release();
			iResult = GetIntFromVariantClear(&vResult);
		}
		VariantClear(&vDB);
	} else if (argc && pcb->pvResult) {
		VariantClear(pcb->pvResult);
		teSetSZA(pcb->pvResult, argv[0], CP_UTF8);
	}
	return iResult;
}

int __stdcall win_sqlite3_callback(void *pArg, int argc, char **argv, char **columnNames)
{
	return sqlite3_callback(pArg, argc, argv, columnNames);
}

//CteSQLite

CteSQLite::CteSQLite(HMODULE hDll, LPWSTR lpLib)
{
	m_cRef = 1;
	m_hDll = hDll;
	m_bsLib = ::SysAllocString(lpLib);
	m_pSQLite3 = NULL;
	m_bWinSQLite3 = PathMatchSpec(lpLib, L"*winsqlite3.dll");

	sqlite3_open = GetProcAddress(m_hDll, "sqlite3_open");
	sqlite3_close = GetProcAddress(m_hDll, "sqlite3_close");
	sqlite3_exec = GetProcAddress(m_hDll, "sqlite3_exec");
	sqlite3_free = GetProcAddress(m_hDll, "sqlite3_free");
}

CteSQLite::~CteSQLite()
{
	Close();
	for (size_t i = g_ppObject.size(); i--;) {
		if (this == g_ppObject[i]) {
			g_ppObject.erase(g_ppObject.begin() + i);
			break;
		}
	}
}

VOID CteSQLite::Close()
{
	if (m_hDll) {
		FreeLibrary(m_hDll);
		m_hDll = NULL;
	}
	sqlite3_open = NULL;
	sqlite3_exec = NULL;
	sqlite3_close = NULL;
	sqlite3_free = NULL;
}

STDMETHODIMP CteSQLite::QueryInterface(REFIID riid, void **ppvObject)
{
	static const QITAB qit[] =
	{
		QITABENT(CteSQLite, IDispatch),
		{ 0 },
	};
	return QISearch(this, qit, riid, ppvObject);
}

STDMETHODIMP_(ULONG) CteSQLite::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteSQLite::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}
	return m_cRef;
}

STDMETHODIMP CteSQLite::GetTypeInfoCount(UINT *pctinfo)
{
	*pctinfo = 0;
	return S_OK;
}

STDMETHODIMP CteSQLite::GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo)
{
	return E_NOTIMPL;
}

STDMETHODIMP CteSQLite::GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId)
{
	BSTR bs = ::SysAllocString(*rgszNames);
	for (int i = ::SysStringLen(bs); i-- > 0;) {
		bs[i] = tolower(bs[i]);
	}
	auto itr = g_umTSPI.find(bs);
	::SysFreeString(bs);
	if (itr != g_umTSPI.end()) {
		*rgDispId = itr->second;
		return S_OK;
	}
#ifdef _DEBUG
	OutputDebugStringA("GetIDsOfNames:");
	OutputDebugString(rgszNames[0]);
	OutputDebugStringA("\n");
#endif
	return DISP_E_UNKNOWNNAME;
}

STDMETHODIMP CteSQLite::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	int iResult = SQLITE_ERROR;
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;
	try {
		switch (dispIdMember) {
			//sqlite3_open
			case 0x60010001:
				if (nArg >= 0 && sqlite3_open) {
					LPSTR lpFile = teWide2Ansi(GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]), -1, CP_UTF8);
					if (lpFile) {
						if (m_bWinSQLite3) {
							iResult = ((LPFN_win_sqlite3_open)sqlite3_open)(lpFile, &m_pSQLite3);
						} else {
							iResult = ((LPFN_sqlite3_open)sqlite3_open)(lpFile, &m_pSQLite3);
						}
						teFreeAnsiString(&lpFile);
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET && sqlite3_open != NULL) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
				return S_OK;
			//sqlite3_close
			case 0x60010002:
				if (wFlags != DISPATCH_PROPERTYGET && sqlite3_close) {
					if (m_pSQLite3) {
						if (m_bWinSQLite3) {
							iResult = ((LPFN_win_sqlite3_close)sqlite3_close)(m_pSQLite3);
						} else {
							iResult = ((LPFN_sqlite3_close)sqlite3_close)(m_pSQLite3);
						}
						m_pSQLite3 = NULL;
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET && sqlite3_open != NULL) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
				return S_OK;
			//sqlite3_exec
			case 0x60010003:
				if (nArg >= 0 && sqlite3_exec && sqlite3_free) {
					LPSTR lpExec = teWide2Ansi(GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]), -1, CP_UTF8);
					if (lpExec) {
						TECallback cb;
						::ZeroMemory(&cb, sizeof(TECallback));
						char *lpErr = NULL;
						int nValue = nArg >= 1 ? GetIntFromVariant(&pDispParams->rgvarg[nArg - 1]) : 0;
						if (nValue) {
							cb.pvResult = pVarResult;
						}
						if (nArg >= 2) {
							FindUnknown(&pDispParams->rgvarg[nArg - 1], &cb.punkCallback);
							FindUnknown(&pDispParams->rgvarg[nArg - 2], &cb.punkDB);
						}
						if (m_bWinSQLite3) {
							iResult = ((LPFN_win_sqlite3_exec)sqlite3_exec)(m_pSQLite3, lpExec, win_sqlite3_callback, &cb, &lpErr);
						} else {
							iResult = ((LPFN_sqlite3_exec)sqlite3_exec)(m_pSQLite3, lpExec, sqlite3_callback, &cb, &lpErr);
						}
						if (nValue) {
							iResult = -1;
						}
						teFreeAnsiString(&lpExec);
						if (lpErr) {
							IUnknown *punk;
							if (nArg >= 3 && FindUnknown(&pDispParams->rgvarg[nArg - 3], &punk)) {
								VARIANT v;
								VariantInit(&v);
								teSetSZA(&v, lpErr, CP_UTF8);
								tePutProperty(punk, L"0", &v);
								VariantClear(&v);
							}
							if (m_bWinSQLite3) {
								((LPFN_win_sqlite3_free)sqlite3_free)(lpErr);
							} else {
								((LPFN_sqlite3_free)sqlite3_free)(lpErr);
							}
						}
					}
					if (iResult >= 0 && pVarResult) {
						VariantClear(pVarResult);
						teSetLong(pVarResult, iResult);
					}
				} else if (wFlags == DISPATCH_PROPERTYGET && sqlite3_open != NULL) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
				return S_OK;
			//this
			case DISPID_VALUE:
				if (pVarResult) {
					teSetObject(pVarResult, this);
				}
				return S_OK;
		}//end_switch
	} catch (...) {
		return DISP_E_EXCEPTION;
	}
	return DISP_E_MEMBERNOTFOUND;
}

//CteBase

CteBase::CteBase()
{
	m_cRef = 1;
}

CteBase::~CteBase()
{
}

STDMETHODIMP CteBase::QueryInterface(REFIID riid, void **ppvObject)
{
	static const QITAB qit[] =
	{
		QITABENT(CteBase, IDispatch),
		{ 0 },
	};
	return QISearch(this, qit, riid, ppvObject);
}

STDMETHODIMP_(ULONG) CteBase::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteBase::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}
	return m_cRef;
}

STDMETHODIMP CteBase::GetTypeInfoCount(UINT *pctinfo)
{
	*pctinfo = 0;
	return S_OK;
}

STDMETHODIMP CteBase::GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo)
{
	return E_NOTIMPL;
}

STDMETHODIMP CteBase::GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId)
{
	BSTR bs = ::SysAllocString(*rgszNames);
	for (int i = ::SysStringLen(bs); i-- > 0;) {
		bs[i] = tolower(bs[i]);
	}
	auto itr = g_umBASE.find(bs);
	::SysFreeString(bs);
	if (itr != g_umBASE.end()) {
		*rgDispId = itr->second;
		return S_OK;
	}
#ifdef _DEBUG
	OutputDebugStringA("GetIDsOfNames:");
	OutputDebugString(rgszNames[0]);
	OutputDebugStringA("\n");
#endif
	return DISP_E_UNKNOWNNAME;
}

STDMETHODIMP CteBase::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	if (wFlags == DISPATCH_PROPERTYGET && dispIdMember >= TE_METHOD) {
		teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
		return S_OK;
	}
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;
	HRESULT hr = S_OK;
	switch (dispIdMember) {
		//Open
		case 0x60010000:
			if (nArg >= 0) {
				LPWSTR lpLib = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
				CteSQLite *pItem;
				for (size_t i = g_ppObject.size(); i--;) {
					pItem = g_ppObject[i];
					if (lstrcmpi(lpLib, pItem->m_bsLib) == 0) {
						teSetObject(pVarResult, pItem);
						return S_OK;
					}
				}
				HMODULE hDll = LoadLibrary(lpLib);
				if (hDll) {
					pItem = new CteSQLite(hDll, lpLib);
					g_ppObject.push_back(pItem);
					teSetObjectRelease(pVarResult, pItem);
				}
			}
			return S_OK;
		//Close
		case 0x6001000C:
			if (nArg >= 0) {
				LPWSTR lpLib = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);

				for (size_t i = g_ppObject.size(); i--;) {
					if (lstrcmpi(lpLib, g_ppObject[i]->m_bsLib) == 0) {
						g_ppObject[i]->Close();
						SafeRelease(&g_ppObject[i]);
						g_ppObject.erase(g_ppObject.begin() + i);
						break;
					}
				}
			}
			return S_OK;
		//this
		case DISPID_VALUE:
			if (pVarResult) {
				teSetObject(pVarResult, this);
			}
			return S_OK;
	}//end_switch
	return DISP_E_MEMBERNOTFOUND;
}

// CteClassFactory

STDMETHODIMP CteClassFactory::QueryInterface(REFIID riid, void **ppvObject)
{
	static const QITAB qit[] =
	{
		QITABENT(CteClassFactory, IClassFactory),
		{ 0 },
	};
	return QISearch(this, qit, riid, ppvObject);
}

STDMETHODIMP_(ULONG) CteClassFactory::AddRef()
{
	LockModule(TRUE);
	return 2;
}

STDMETHODIMP_(ULONG) CteClassFactory::Release()
{
	LockModule(FALSE);
	return 1;
}

STDMETHODIMP CteClassFactory::CreateInstance(IUnknown *pUnkOuter, REFIID riid, void **ppvObject)
{
	*ppvObject = NULL;

	if (pUnkOuter != NULL) {
		return CLASS_E_NOAGGREGATION;
	}
	return g_pBase->QueryInterface(riid, ppvObject);
}

STDMETHODIMP CteClassFactory::LockServer(BOOL fLock)
{
	LockModule(fLock);
	return S_OK;
}

//CteDispatch

CteDispatch::CteDispatch(IDispatch *pDispatch, int nMode, DISPID dispId)
{
	m_cRef = 1;
	pDispatch->QueryInterface(IID_PPV_ARGS(&m_pDispatch));
	m_dispIdMember = dispId;
}

CteDispatch::~CteDispatch()
{
	Clear();
}

VOID CteDispatch::Clear()
{
	SafeRelease(&m_pDispatch);
}

STDMETHODIMP CteDispatch::QueryInterface(REFIID riid, void **ppvObject)
{
	static const QITAB qit[] =
	{
		QITABENT(CteDispatch, IDispatch),
	{ 0 },
	};
	return QISearch(this, qit, riid, ppvObject);
}

STDMETHODIMP_(ULONG) CteDispatch::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteDispatch::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}

	return m_cRef;
}

STDMETHODIMP CteDispatch::GetTypeInfoCount(UINT *pctinfo)
{
	*pctinfo = 0;
	return S_OK;
}

STDMETHODIMP CteDispatch::GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo)
{
	return E_NOTIMPL;
}

STDMETHODIMP CteDispatch::GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId)
{
	return DISP_E_UNKNOWNNAME;
}

STDMETHODIMP CteDispatch::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	try {
		if (pVarResult) {
			VariantInit(pVarResult);
		}
		if (wFlags & DISPATCH_METHOD) {
			return m_pDispatch->Invoke(m_dispIdMember, riid, lcid, wFlags, pDispParams, pVarResult, pExcepInfo, puArgErr);
		}
		teSetObject(pVarResult, this);
		return S_OK;
	} catch (...) {}
	return DISP_E_MEMBERNOTFOUND;
}
