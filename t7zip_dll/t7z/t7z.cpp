// Tablacus Susie Plug-in Wrapper (C)2017 Gaku
// MIT Lisence
// Visual Studio Express 2017 for Windows Desktop
// Windows SDK v7.1
// https://tablacus.github.io/

#include "t7z.h"

// Global Variables:
const TCHAR g_szProgid[] = TEXT("Tablacus.7z");
const TCHAR g_szClsid[] = TEXT("{BFD084CA-C9AA-4bd3-9984-D5ED699A0711}");
HINSTANCE	g_hinstDll = NULL;
LONG		g_lLocks = 0;
CteBase		*g_pBase = NULL;
HMODULE		g_hDll = NULL;
LPFNCreateObject g_CreateObject = NULL;
LPFNGetNumberOfFormats g_GetNumberOfFormats = NULL;
LPFNGetHandlerProperty2 g_GetHandlerProperty2 = NULL;
LPFNGetImage g_GetImage = NULL;
BOOL g_bIsContent = TRUE;
BSTR g_pbs[T7Z_Strings];
HWND g_hwnd = NULL;

TEmethod methodBASE[] = {
	{ 0x60010000, L"Init" },
	{ 0x60010001, L"IsSupported" },
	{ 0x60010002, L"GetArchiveInfo" },
	{ 0x60010003, L"GetHandlerProperty2" },
	{ 0x6001000C, L"Close" },
	{ 0x6001F010, L"GetImage" },
	{ 0x4001F011, L"GetArchive" },
	{ 0x40010000 + T7Z_FilterList, L"FilterList" },
	{ 0x40010000 + T7Z_DisableList, L"DisableList" },
	{ 0x40010000 + T7Z_FilterExtract, L"FilterExtract" },
	{ 0x40010000 + T7Z_DisableExtract, L"DisableExtract" },
	{ 0x40010000 + T7Z_FilterUpdate, L"FilterUpdate" },
	{ 0x40010000 + T7Z_DisableUpdate, L"DisableUpdate" },
	{ 0x40010000 + T7Z_FilterContent, L"FilterContent" },
	{ 0x40010000 + T7Z_DisableContent, L"DisableContent" },
	{ 0x40010000 + T7Z_FilterPreview, L"FilterPreview" },
	{ 0x40010000 + T7Z_DisablePreview, L"DisablePreview" },
	{ 0x40010000 + T7Z_Path, L"Path" },
	{ 0x40010100, L"IsContent" },
	{ 0x40010101, L"hwnd" },
	{ 0, L"" },
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

VOID teGetProcAddress(HMODULE hModule, LPSTR lpName, FARPROC *lpfnA, FARPROC *lpfnW)
{
	*lpfnA = GetProcAddress(hModule, lpName);
	if (lpfnW) {
		char pszProcName[80];
		strcpy_s(pszProcName, 80, lpName);
		strcat_s(pszProcName, 80, "W");
		*lpfnW = GetProcAddress(hModule, (LPCSTR)pszProcName);
	} else if (lpfnW) {
		*lpfnW = NULL;
	}
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

/*
int teBSearch(TEmethod *method, int nSize, int* pMap, LPOLESTR bs)
{
	int nMin = 0;
	int nMax = nSize - 1;
	int nIndex, nCC;

	while (nMin <= nMax) {
		nIndex = (nMin + nMax) / 2;
		nCC = lstrcmpi(bs, method[pMap[nIndex]].name);
		if (nCC < 0) {
			nMax = nIndex - 1;
			continue;
		}
		if (nCC > 0) {
			nMin = nIndex + 1;
			continue;
		}
		return pMap[nIndex];
	}
	return -1;
}
*/
HRESULT teGetDispId(TEmethod *method, int nCount, int* pMap, LPOLESTR bs, DISPID *rgDispId)
{
/*	if (pMap) {
		int nIndex = teBSearch(method, nCount, pMap, bs);
		if (nIndex >= 0) {
			*rgDispId = method[nIndex].id;
			return S_OK;
		}
	} else {*/
		for (int i = 0; method[i].name; i++) {
			if (lstrcmpi(bs, method[i].name) == 0) {
				*rgDispId = method[i].id;
				return S_OK;
			}
		}
//	}
	return DISP_E_UNKNOWNNAME;
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
LONGLONG GetLLFromVariant(VARIANT *pv)
{
	if (pv) {
		if (pv->vt == (VT_VARIANT | VT_BYREF)) {
			return GetLLFromVariant(pv->pvarVal);
		}
		if (pv->vt == VT_I4) {
			return pv->lVal;
		}
		if (pv->vt == VT_R8) {
			return (LONGLONG)pv->dblVal;
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
		VARIANT vo;
		VariantInit(&vo);
		if SUCCEEDED(VariantChangeType(&vo, pv, 0, VT_I8)) {
			return vo.llVal;
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
			for (int i = T7Z_Strings; i--;) {
				g_pbs[i] = NULL;
			}
			break;
		case DLL_PROCESS_DETACH:
			SafeRelease(&g_pBase);
			for (int i = T7Z_Strings; i--;) {
				teSysFreeString(&g_pbs[i]);
			}
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

//
VOID CALLBACK teTimerProcFree(HWND hwnd, UINT uMsg, UINT_PTR idEvent, DWORD dwTime)
{
	if (hwnd == g_hwnd) {
		KillTimer(g_hwnd, idEvent);
		if (g_hDll) {
			FreeLibrary(g_hDll);
			g_hDll = NULL;
		}
	}
}

VOID teClose()
{
	KillTimer(g_hwnd, (UINT_PTR)teTimerProcFree);
	teSysFreeString(&g_pbs[T7Z_Path]);
	if (g_hDll) {
		FreeLibrary(g_hDll);
		g_hDll = NULL;
	}
}

BOOL teLock()
{
	KillTimer(g_hwnd, (UINT_PTR)teTimerProcFree);
	if (g_hDll) {
		LockModule(TRUE);
		return TRUE;
	}
	g_hDll = LoadLibrary(g_pbs[T7Z_Path]);
	if (g_hDll) {
		g_CreateObject = (LPFNCreateObject)GetProcAddress(g_hDll, "CreateObject");
		g_GetNumberOfFormats = (LPFNGetNumberOfFormats)GetProcAddress(g_hDll, "GetNumberOfFormats");
		g_GetHandlerProperty2 = (LPFNGetHandlerProperty2)GetProcAddress(g_hDll, "GetHandlerProperty2");
		if (g_CreateObject && g_GetNumberOfFormats && g_GetHandlerProperty2) {
			LockModule(TRUE);
			return TRUE;
		} else {
			FreeLibrary(g_hDll);
			g_hDll = NULL;
		}
	}
	return FALSE;
}

VOID teUnlock()
{
	LockModule(FALSE);
	if (g_hDll) {
		SetTimer(g_hwnd, (UINT_PTR)teTimerProcFree, 3000, teTimerProcFree);
	}
}

BSTR teGetExtensionFilter(PROPVARIANT *pv)
{
	if (pv->vt == VT_BSTR) {
		LPWSTR lpszExt = pv->bstrVal;
		if (lpszExt) {
			BSTR bsFilter = ::SysAllocStringLen(NULL, ::SysStringLen(lpszExt) * 4 + 4);
			LPWSTR lpszFilter = bsFilter;
			while (*lpszExt) {
				*lpszFilter++ = '*';
				*lpszFilter++ = '.';
				while (*lpszExt > 0x20) {
					*lpszFilter++ = *lpszExt++;
				}
				*lpszFilter++ = ';';
				if (*lpszExt) {
					lpszExt++;
				}
			}
			if (lpszFilter > bsFilter) {
				lpszFilter--;
			}
			*lpszFilter = NULL;
			return bsFilter;
		}
	}
	return ::SysAllocString(L"-");
}

HRESULT teGetInArchiveFromStream(IStream *pStream, LPWSTR lpszPath, BOOL bUpdate, IDispatch *pdispCB, IInArchive **ppInArchive)
{
	HRESULT hr = E_NOINTERFACE;
	CLSID clsidFormat;
	IInStream *pInStream = new CteInStream(pStream);
	UInt32 uItems;
	if (g_GetNumberOfFormats(&uItems) == S_OK) {
		PROPVARIANT propVar;
		::PropVariantInit(&propVar);
		for (UInt32 i = 0; FAILED(hr) && i < uItems; i++) {
			g_GetHandlerProperty2(i, NArchive::NHandlerPropID::kExtension, &propVar);
			BSTR bsFilter = teGetExtensionFilter(&propVar);
			if (PathMatchSpec(lpszPath, bsFilter)) {
				::PropVariantClear(&propVar);
				g_GetHandlerProperty2(i, NArchive::NHandlerPropID::kClassID, &propVar);
				if (propVar.vt == VT_BSTR) {
					if (::SysStringByteLen(propVar.bstrVal) == sizeof(CLSID)) {
						::CopyMemory(&clsidFormat, propVar.bstrVal, sizeof(CLSID));
						if (bUpdate) {
							::PropVariantClear(&propVar);
							g_GetHandlerProperty2(i, NArchive::NHandlerPropID::kUpdate, &propVar);
							if (propVar.vt == VT_BOOL && !propVar.boolVal) {
								hr = E_NOTIMPL;
							}
						}
						if (hr != E_NOTIMPL) {
							if SUCCEEDED(g_CreateObject(&clsidFormat, &IID_IInArchive, (void**)ppInArchive)) {
								UInt64 maxCheckStartPosition = 0;
								IArchiveOpenCallback *pCallback = new CteArchiveOpenCallback(pdispCB);
								if ((*ppInArchive)->Open(pInStream, &maxCheckStartPosition, pCallback) == S_OK) {
									hr = S_OK;
								} else {
									SafeRelease(ppInArchive);
								}
							}
						}
					}
				}
			}
			::SysAllocString(bsFilter);
			::PropVariantClear(&propVar);
		}
	}
	pInStream->Release();
	return hr;
}

HRESULT ExtractToStream(LPWSTR lpszArcPath, LPWSTR lpszFilter, IStream **ppStream, BSTR *pbsItem, int nFilter, int nDisable)
{
	HRESULT hr = E_NOTIMPL;
	if (lstrlen(g_pbs[T7Z_FilterPreview]) == 0) {
		return hr;
	}
	if (!PathMatchSpec(lpszArcPath, g_pbs[T7Z_FilterExtract]) || PathMatchSpec(lpszArcPath, g_pbs[T7Z_DisableExtract])) {
		return hr;
	}
	IStream *pStream;
	if FAILED(SHCreateStreamOnFileEx(lpszArcPath, STGM_READ | STGM_SHARE_DENY_NONE, FILE_ATTRIBUTE_NORMAL, FALSE, NULL, &pStream)) {
		return E_FAIL;
	}
	IInArchive *pInArchive;
	if SUCCEEDED(teGetInArchiveFromStream(pStream, lpszArcPath, NULL, FALSE, &pInArchive)) {
		IStream *pStreamOut = NULL;
		IArchiveExtractCallback *pCallback = new CteArchiveExtractCallback(pInArchive, lpszFilter, nFilter, nDisable, &pStreamOut, pbsItem);
		pInArchive->Extract(NULL, (UInt32)-1, FALSE, pCallback);
		pInArchive->Release();
		if (pStreamOut) {
			*ppStream = pStreamOut;
			hr = S_OK;
		}
	}
	pStream->Release();
	return hr;
}

//GetArchive
HRESULT WINAPI GetArchive(LPWSTR lpszArcPath, LPWSTR lpszItem, IStream **ppStream, LPVOID lpReserved)
{
	HRESULT hr = E_NOTIMPL;
	if (teLock()) {
		hr = ExtractToStream(lpszArcPath, lpszItem, ppStream, NULL, T7Z_FilterContent, T7Z_DisableContent);
		teUnlock();
	}
	LockModule(FALSE);
	return hr;
}

//GetImage
HRESULT WINAPI GetImage(IStream *pStream, LPWSTR lpszPath, int cx, HBITMAP *phBM, int *pnAlpha)
{
	HRESULT hr = E_NOTIMPL;
	if (teLock()) {
		if (g_GetImage && g_bIsContent) {
			if (PathMatchSpec(lpszPath, L"?:\\*;\\\\*")) {
				IStream *pStreamOut = NULL;
				BSTR bsItem = NULL;
				if SUCCEEDED(ExtractToStream(lpszPath, g_pbs[T7Z_FilterPreview], &pStreamOut, &bsItem, T7Z_FilterPreview, T7Z_DisablePreview)) {
					hr = g_GetImage(pStreamOut, bsItem, cx, phBM, pnAlpha);
				}
				SafeRelease(&pStreamOut);
				teSysFreeString(&bsItem);
			}
		}
		teUnlock();
	}
	return hr;
}

//CteBase

CteBase::CteBase()
{
	m_cRef = 1;
}

CteBase::~CteBase()
{
	teClose();
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
	return teGetDispId(methodBASE, _countof(methodBASE), NULL, *rgszNames, rgDispId);
}

STDMETHODIMP CteBase::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;

	switch (dispIdMember) {
		case 0x60010000://Init
			BOOL bReady;
			if (nArg >= 0) {
				bReady = g_pbs[T7Z_Path] != NULL;
				if (!bReady) {
					g_pbs[T7Z_Path] = ::SysAllocString(GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]));
					if (teLock()) {
						bReady = TRUE;
						teUnlock();
					} else {
						teSysFreeString(&g_pbs[T7Z_Path]);
					}
				}
			}
			teSetBool(pVarResult, bReady);
			return S_OK;

		case 0x60010001://IsSupported
			if (nArg >= 1 && teLock()) {
				if (pDispParams->rgvarg[nArg].vt == VT_BSTR) {
					BSTR bsPath = pDispParams->rgvarg[nArg].bstrVal;
					UINT nMode = GetIntFromVariant(&pDispParams->rgvarg[nArg - 1]);
					if (nMode > 2) {
						nMode = 2;
					}
					if (PathMatchSpec(bsPath, g_pbs[nMode * 2]) && !PathMatchSpec(bsPath, g_pbs[nMode * 2 + 1])) {
						IStream *pStream;
						if SUCCEEDED(SHCreateStreamOnFileEx(bsPath, STGM_READ | STGM_SHARE_DENY_NONE, FILE_ATTRIBUTE_NORMAL, FALSE, NULL, &pStream)) {
							IInArchive *pInArchive;
							if SUCCEEDED(teGetInArchiveFromStream(pStream, bsPath, nMode >= 2, NULL, &pInArchive)) {
								teSetBool(pVarResult, TRUE);
								pInArchive->Close();
								pInArchive->Release();
							}
							pStream->Release();
						}
					}
				}
				teUnlock();
			}
			return S_OK;

		case 0x60010002://GetArchiveInfo
			if (nArg >= 0 && teLock()) {
				IDispatch *pdisp;
				if (GetDispatch(&pDispParams->rgvarg[nArg], &pdisp)) {
					VARIANT vPath, vGetProperty;
					VariantInit(&vPath);
					teGetProperty(pdisp, L"Path", &vPath);
					VariantInit(&vGetProperty);
					teGetProperty(pdisp, L"GetProperty", &vGetProperty);
					if (vPath.vt == VT_BSTR && vGetProperty.vt == VT_DISPATCH &&
						PathMatchSpec(vPath.bstrVal, g_pbs[T7Z_FilterList]) && !PathMatchSpec(vPath.bstrVal, g_pbs[T7Z_DisableList])) {
						IStream *pStream;
						if SUCCEEDED(SHCreateStreamOnFileEx(vPath.bstrVal, STGM_READ | STGM_SHARE_DENY_NONE, FILE_ATTRIBUTE_NORMAL, FALSE, NULL, &pStream)) {
							IInArchive *pInArchive;
							if SUCCEEDED(teGetInArchiveFromStream(pStream, vPath.bstrVal, FALSE, pdisp, &pInArchive)) {
								UInt32 uItems = 0;
								if (pInArchive->GetNumberOfItems(&uItems) == S_OK) {
									teSetLong(pVarResult, uItems);
									PROPVARIANT propVar;
									PropVariantInit(&propVar);
									int pKid[] = { kpidPath, kpidIsDir, kpidAttrib, kpidSize, kpidMTime };
									int nColumns = _countof(pKid);
									for (UInt32 i = 0; i < uItems; i++) {
										VARIANTARG *pv = GetNewVARIANT(nColumns + 1);
										VariantCopy(&pv[nColumns], &pDispParams->rgvarg[nArg]);
										for (int j = nColumns, k = 0; j--; k++) {
											pInArchive->GetProperty(i, pKid[j], &propVar);
											if (propVar.vt == VT_FILETIME) {
												FILETIME ft;
												if (::FileTimeToLocalFileTime(&propVar.filetime, &ft)) {
													SYSTEMTIME st;
													if (::FileTimeToSystemTime(&ft, &st)) {
														if (::SystemTimeToVariantTime(&st, &pv[k].date)) {
															pv[k].vt = VT_DATE;
														}
													}
												}
											} else {
												VariantCopy(&pv[k], (VARIANTARG *)&propVar);
											}
											PropVariantClear(&propVar);
										}
										Invoke4(vGetProperty.pdispVal, NULL, nColumns + 1, pv);
									}
								}
								pInArchive->Close();
								pInArchive->Release();
							}
							pStream->Release();
						}
					}
					VariantClear(&vGetProperty);
					VariantClear(&vPath);
					pdisp->Release();
				}
				teUnlock();
			}
			return S_OK;
		case 0x60010003://GetHandlerProperty2
			if (nArg >= 1 && teLock()) {
				IDispatch *pdisp;
				if (GetDispatch(&pDispParams->rgvarg[nArg - 1], &pdisp)) {
					UInt32 uItems;
					if (g_GetNumberOfFormats(&uItems) == S_OK) {
						teSetLong(pVarResult, uItems);
						PROPVARIANT propVar;
						PropVariantInit(&propVar);
						int pKid[] = {
							NArchive::NHandlerPropID::kName,
							NArchive::NHandlerPropID::kClassID,
							NArchive::NHandlerPropID::kExtension,
							NArchive::NHandlerPropID::kAddExtension,
							NArchive::NHandlerPropID::kUpdate,
							NArchive::NHandlerPropID::kKeepName,
							NArchive::NHandlerPropID::kSignature,
							NArchive::NHandlerPropID::kMultiSignature,
							NArchive::NHandlerPropID::kSignatureOffset,
							NArchive::NHandlerPropID::kAltStreams,
							NArchive::NHandlerPropID::kNtSecure,
							NArchive::NHandlerPropID::kFlags
						};
						int nColumns = _countof(pKid);
						for (UInt32 i = 0; i < uItems; i++) {
							VARIANTARG *pv = GetNewVARIANT(nColumns + 1);
							VariantCopy(&pv[nColumns], &pDispParams->rgvarg[nArg]);
							for (int j = nColumns, k = 0; j--; k++) {
								g_GetHandlerProperty2(i, pKid[j], &propVar);
								VariantCopy(&pv[k], (VARIANTARG *)&propVar);
								PropVariantClear(&propVar);
							}
							Invoke4(pdisp, NULL, nColumns + 1, pv);
						}
					}
					pdisp->Release();
				}
				teUnlock();
			}
			return S_OK;
		case 0x6001000C://Close
			teClose();
			return S_OK;

		case 0x6001F010://GetImage
			if (nArg >= 0) {
				g_GetImage = (LPFNGetImage)GetPtrFromVariant(&pDispParams->rgvarg[nArg]);
			}
			teSetPtr(pVarResult, GetImage);

			return S_OK;
		case 0x4001F011://GetArchve
			teSetPtr(pVarResult, GetArchive);
			return S_OK;

		case 0x40010100://IsContent
			if (nArg >= 0) {
				g_bIsContent = GetIntFromVariant(&pDispParams->rgvarg[nArg]);
			}
			teSetBool(pVarResult, g_bIsContent);
			return S_OK;

		case 0x40010101://hwnd
			if (nArg >= 0) {
				g_hwnd = (HWND)GetPtrFromVariant(&pDispParams->rgvarg[nArg]);
			}
			teSetPtr(pVarResult, g_hwnd);
			return S_OK;


		case DISPID_VALUE://this
			if (pVarResult) {
				teSetObject(pVarResult, this);
			}
			return S_OK;

		default:
			if (dispIdMember >= 0x40010000 && dispIdMember < 0x40010000 + T7Z_Strings) {
				if (nArg >= 0) {
					teSysFreeString(&g_pbs[dispIdMember - 0x40010000]);
					g_pbs[dispIdMember - 0x40010000] = ::SysAllocString(GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]));
				}
				teSetSZ(pVarResult, g_pbs[dispIdMember - 0x40010000]);
				return S_OK;
			}
	}//end_switch
	return DISP_E_MEMBERNOTFOUND;
}

//CteInStream

CteInStream::CteInStream(IStream *pStream)
{
	m_cRef = 1;
	m_pStream = pStream;
}

CteInStream::~CteInStream()
{
}

STDMETHODIMP CteInStream::QueryInterface(REFIID riid, void **ppvObject)
{
	if (IsEqualIID(riid, IID_IInStream)) {
		*ppvObject = static_cast<IInStream *>(this);
		AddRef();
		return S_OK;
	}
	if (IsEqualIID(riid, IID_ISequentialInStream)) {
		*ppvObject = static_cast<ISequentialInStream *>(this);
		AddRef();
		return S_OK;
	}
	return E_NOINTERFACE;
}

STDMETHODIMP_(ULONG) CteInStream::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteInStream::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}
	return m_cRef;
}

//ISequentialInStream
STDMETHODIMP CteInStream::Read(void *data, UInt32 size, UInt32 *processedSize)
{
	return m_pStream->Read(data, size, (ULONG *)processedSize);
}

//IInStream
STDMETHODIMP CteInStream::Seek(Int64 offset, UInt32 seekOrigin, UInt64 *newPosition)
{
	ULARGE_INTEGER uliPos;
	LARGE_INTEGER liOffset;
	liOffset.QuadPart = offset;
	HRESULT hr = m_pStream->Seek(liOffset, seekOrigin, &uliPos);
	if (newPosition) {
		*newPosition = uliPos.QuadPart;
	}
	return hr;
}

//CteOutStream

CteOutStream::CteOutStream(IStream * pStream)
{
	m_cRef = 1;
	m_pStream = pStream;
}

CteOutStream:: ~CteOutStream()
{
}

STDMETHODIMP CteOutStream::QueryInterface(REFIID riid, void ** ppvObject)
{
	if (IsEqualIID(riid, IID_IOutStream)) {
		*ppvObject = static_cast <IOutStream *> (this);
		AddRef();
		return S_OK;
	}
	if (IsEqualIID(riid, IID_ISequentialOutStream)) {
		*ppvObject = static_cast <ISequentialOutStream *> (this);
		AddRef();
		return S_OK;
	}
	return E_NOINTERFACE;
}

STDMETHODIMP_(ULONG) CteOutStream::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteOutStream::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}
	return m_cRef;
}

//ISequentialOutStream
STDMETHODIMP CteOutStream::Write(const void *data, UInt32 size, UInt32 *processedSize)
{
	return m_pStream->Write(data, size, (ULONG *)processedSize);
}

//IOutStream
STDMETHODIMP CteOutStream::Seek(Int64 offset, UInt32 seekOrigin, UInt64 * newPosition)
{
	ULARGE_INTEGER uliPos;
	LARGE_INTEGER liOffset;
	liOffset.QuadPart = offset;
	HRESULT hr = m_pStream->Seek(liOffset, seekOrigin, &uliPos);
	if (newPosition) {
		*newPosition = uliPos.QuadPart;
	}
	return hr;
}

STDMETHODIMP CteOutStream::SetSize(UInt64 newSize)
{
	ULARGE_INTEGER uliSize;
	uliSize.QuadPart = newSize;
	return m_pStream->SetSize(uliSize);
}

//CteArchiveOpenCallback

CteArchiveOpenCallback::CteArchiveOpenCallback(IDispatch *pdisp)
{
	m_cRef = 1;
	VariantInit(&m_vGetPassword);
	m_pdisp = NULL;
	if (pdisp) {
		pdisp->QueryInterface(IID_PPV_ARGS(&m_pdisp));
		teGetProperty(pdisp, L"GetPassword", &m_vGetPassword);
	}
}

CteArchiveOpenCallback::~CteArchiveOpenCallback()
{
	VariantClear(&m_vGetPassword);
	SafeRelease(&m_pdisp);
}

STDMETHODIMP CteArchiveOpenCallback::QueryInterface(REFIID riid, void **ppvObject)
{
	if (IsEqualIID(riid, IID_IArchiveOpenCallback)) {
		*ppvObject = static_cast<IArchiveOpenCallback *>(this);
		AddRef();
		return S_OK;
	}
	if (m_vGetPassword.vt == VT_DISPATCH && IsEqualIID(riid, IID_ICryptoGetTextPassword)) {
		*ppvObject = static_cast<ICryptoGetTextPassword *>(this);
		AddRef();
		return S_OK;
	}
	return E_NOINTERFACE;
}

STDMETHODIMP_(ULONG) CteArchiveOpenCallback::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteArchiveOpenCallback::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}
	return m_cRef;
}

//IArchiveOpenCallback
STDMETHODIMP CteArchiveOpenCallback::SetTotal(const UInt64 *files, const UInt64 *bytes)
{
	return S_OK;
}

STDMETHODIMP CteArchiveOpenCallback::SetCompleted(const UInt64 *files, const UInt64 *bytes)
{
	return S_OK;
}

//ICryptoGetTextPassword
STDMETHODIMP CteArchiveOpenCallback::CryptoGetTextPassword(BSTR *password)
{
	HRESULT hr = E_NOTIMPL;
	VARIANT v;
	VariantInit(&v);
	if (m_vGetPassword.vt == VT_DISPATCH) {
		VARIANTARG *pv = GetNewVARIANT(1);
		teSetObject(&pv[0], m_pdisp);
		hr = Invoke4(m_vGetPassword.pdispVal, &v, 1, pv);
		if (hr == S_OK) {
			if (v.vt == VT_BSTR) {
				*password = ::SysAllocString(v.bstrVal);
			}
			VariantClear(&v);
		}
	}
	return hr;
}

//CteArchiveExtractCallback

CteArchiveExtractCallback::CteArchiveExtractCallback(IInArchive *pInArchive, LPWSTR lpszFilter, int nFilter, int nDisable, IStream **ppStream, BSTR *pbsItem)
{
	m_cRef = 1;
	m_pInArchive = pInArchive;
	m_lpszFilter = lpszFilter;
	m_ppStream = ppStream;
	m_pbsItem = pbsItem;
	m_nFilter = nFilter;
	m_nDisable = nDisable;
	m_bDone = FALSE;
}

CteArchiveExtractCallback::~CteArchiveExtractCallback()
{
}

STDMETHODIMP CteArchiveExtractCallback::QueryInterface(REFIID riid, void **ppvObject)
{
	if (IsEqualIID(riid, IID_IArchiveExtractCallback)) {
		*ppvObject = static_cast<IArchiveExtractCallback *>(this);
		AddRef();
		return S_OK;
	}
	return E_NOINTERFACE;
}

STDMETHODIMP_(ULONG) CteArchiveExtractCallback::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteArchiveExtractCallback::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}
	return m_cRef;
}

//IIArchiveExtractCallback
STDMETHODIMP CteArchiveExtractCallback::GetStream(UInt32 index, ISequentialOutStream **outStream, Int32 askExtractMode)
{
	if (outStream) {
		*outStream = NULL;
		if (m_bDone) {
			return S_FALSE;
		}
		PROPVARIANT propVar;
		PropVariantInit(&propVar);
		if SUCCEEDED(m_pInArchive->GetProperty(index, kpidPath, &propVar)) {
			m_bDone = propVar.vt == VT_BSTR && PathMatchSpec(propVar.bstrVal, m_lpszFilter);
		}
		if (m_bDone && PathMatchSpec(propVar.bstrVal, g_pbs[m_nFilter]) && !PathMatchSpec(propVar.bstrVal, g_pbs[m_nDisable])) {
			*m_ppStream = SHCreateMemStream(NULL, NULL);
			*outStream = new CteOutStream(*m_ppStream);
			if (m_pbsItem) {
				*m_pbsItem = ::SysAllocString(propVar.bstrVal);
			}
		}
		PropVariantClear(&propVar);
		return S_OK;
	}
	return E_INVALIDARG;
}

STDMETHODIMP CteArchiveExtractCallback::PrepareOperation(Int32 askExtractMode)
{
	return S_OK;
}

STDMETHODIMP CteArchiveExtractCallback::SetOperationResult(Int32 opRes)
{
	return S_OK;
}

STDMETHODIMP CteArchiveExtractCallback::SetTotal(UInt64 total)
{
	return S_OK;
}

STDMETHODIMP CteArchiveExtractCallback::SetCompleted(const UInt64 *completeValue)
{
	return S_OK;
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
