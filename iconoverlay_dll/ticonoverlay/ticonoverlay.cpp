// Tablacus Shell icon overlay wrapper (C)2018 Gaku
// MIT Lisence
// Visual Studio Express 2017 for Windows Desktop
// Windows SDK v7.1
// https://tablacus.github.io/

#include "ticonoverlay.h"

// Global Variables:
const TCHAR g_szProgid[] = TEXT("Tablacus.IconOverlay");
const TCHAR g_szClsid[] = TEXT("{ADB2CB70-5C00-4fa2-B121-CB60B556FFA7}");
HINSTANCE	g_hinstDll = NULL;
CteBase		*g_pBase = NULL;
std::vector<DWORD>	g_pIconOverlayHandlers;
std::vector<TEGetOverlayIcon *>	g_pIconOverlay;
LONG		g_lLocks = 0;
LONG		g_lThreads = 0;
DWORD		g_dwBase = 11;
DWORD		g_dwCookie = 0;
BOOL		g_bAlive = TRUE;

TEmethod methodBASE[] = {
	{ 0x60010000, L"Init" },
	{ 0x60010001, L"Finalize" },
	{ 0x60010002, L"GetOverlayInfo" },
	{ 0x60010003, L"GetOverlayIconIndex" },
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

VOID LockModule()
{
	::InterlockedIncrement(&g_lLocks);
}

VOID UnlockModule()
{
	::InterlockedDecrement(&g_lLocks);
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

static void threadGetOverlayIconIndex(void *args)
{
	::CoInitialize(NULL);
	std::vector<IShellIconOverlayIdentifier *>	pIconOverlayHandlers;
	IGlobalInterfaceTable *pGlobalInterfaceTable;
	CoCreateInstance(CLSID_StdGlobalInterfaceTable, NULL, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pGlobalInterfaceTable));
	IDispatch *pCB = NULL;
	try {
		while (!g_pIconOverlay.empty()) {
			TEGetOverlayIcon *pGOI = g_pIconOverlay.back();
			g_pIconOverlay.pop_back();
			for (size_t i = 0; g_bAlive && i < g_pIconOverlayHandlers.size(); i++) {
				IShellIconOverlayIdentifier *psio;
				if (i < pIconOverlayHandlers.size()) {
					psio = pIconOverlayHandlers[i];
				} else {
					pGlobalInterfaceTable->GetInterfaceFromGlobal(g_pIconOverlayHandlers[i], IID_PPV_ARGS(&psio));
					pIconOverlayHandlers.push_back(psio);
				}
				if (psio && psio->IsMemberOf(pGOI->bsPath, pGOI->dwAttrib) == S_OK) {
					BOOL bGet = TRUE;
					LPITEMIDLIST pidl = ILCreateFromPath(pGOI->bsPath);
					if (pidl) {
						IShellIconOverlay *pShellIconOverlay;
						LPCITEMIDLIST pidlLast;
						if SUCCEEDED(::SHBindToParent(pidl, IID_PPV_ARGS(&pShellIconOverlay), &pidlLast)) {
							int iIndex;
							if (pShellIconOverlay->GetOverlayIndex(pidlLast, &iIndex) == S_OK) {
								if (iIndex > 0) {
									bGet = FALSE;
								}
							}
							pShellIconOverlay->Release();
						}
						::ILFree(pidl);
					}
					if (bGet) {
						if (!pCB) {
							pGlobalInterfaceTable->GetInterfaceFromGlobal(g_dwCookie, IID_PPV_ARGS(&pCB));
						}
						if (pCB) {
							VARIANT *pv = GetNewVARIANT(3);
							teSetSZ(&pv[2], pGOI->bsPath);
							teSetLong(&pv[1], i);
							teSetLong(&pv[0], pGOI->Id);
							Invoke4(pCB, NULL, 3, pv);
						}
					}
					break;
				}
			}
			teSysFreeString(&pGOI->bsPath);
			delete[] pGOI;
		}
	} catch (...) {}
	::InterlockedDecrement(&g_lThreads);
	while (!pIconOverlayHandlers.empty()) {
		SafeRelease(&pIconOverlayHandlers.back());
		pIconOverlayHandlers.pop_back();
	}
	SafeRelease(&pCB);
	pGlobalInterfaceTable->Release();
	::CoUninitialize();
	::_endthread();
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
			SafeRelease(&g_pBase);
			break;
	}
	return TRUE;
}

// DLL Export

STDAPI DllCanUnloadNow(void)
{
	return g_lLocks + g_lThreads == 0 ? S_OK : S_FALSE;
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


VOID ClearIconOverlayHandlers()
{
	IGlobalInterfaceTable *pGlobalInterfaceTable;
	CoCreateInstance(CLSID_StdGlobalInterfaceTable, NULL, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pGlobalInterfaceTable));
	while (!g_pIconOverlayHandlers.empty()) {
		DWORD dwCookie = g_pIconOverlayHandlers.back();
		g_pIconOverlayHandlers.pop_back();
		pGlobalInterfaceTable->RevokeInterfaceFromGlobal(dwCookie);
	}
	pGlobalInterfaceTable->Release();
}


//CteBase

CteBase::CteBase()
{
	m_cRef = 1;
}

CteBase::~CteBase()
{
	Finalize();
}

VOID CteBase::Finalize()
{
	ClearIconOverlayHandlers();
	while (!g_pIconOverlay.empty()) {
		TEGetOverlayIcon *pGOI = g_pIconOverlay.back();
		g_pIconOverlay.pop_back();
		teSysFreeString(&pGOI->bsPath);
	}
	g_bAlive = FALSE;
	if (g_dwCookie) {
		IGlobalInterfaceTable *pGlobalInterfaceTable;
		CoCreateInstance(CLSID_StdGlobalInterfaceTable, NULL, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pGlobalInterfaceTable));
		pGlobalInterfaceTable->RevokeInterfaceFromGlobal(g_dwCookie);
		pGlobalInterfaceTable->Release();
		g_dwCookie = 0;
	}
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

bool SortIconOverlayHandlers(DWORD dwCookie1, DWORD dwCookie2)
{
	IGlobalInterfaceTable *pGlobalInterfaceTable;
	int iPriority1, iPriority2;
	IShellIconOverlayIdentifier *psio1, *psio2;
	CoCreateInstance(CLSID_StdGlobalInterfaceTable, NULL, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pGlobalInterfaceTable));
	pGlobalInterfaceTable->GetInterfaceFromGlobal(dwCookie1, IID_PPV_ARGS(&psio1));
	psio1->GetPriority(&iPriority1);
	SafeRelease(&psio1);
	pGlobalInterfaceTable->GetInterfaceFromGlobal(dwCookie2, IID_PPV_ARGS(&psio2));
	psio2->GetPriority(&iPriority2);
	SafeRelease(&psio2);
	pGlobalInterfaceTable->Release();
	return iPriority1 < iPriority2;
}

STDMETHODIMP CteBase::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;
	HRESULT hr = S_OK;
	try {
		switch (dispIdMember) {

		case 0x60010000://Init
			if (nArg >= 1 && pDispParams->rgvarg[nArg - 1].vt == VT_DISPATCH) {
				g_dwBase = GetIntFromVariant(&pDispParams->rgvarg[nArg]);
				IGlobalInterfaceTable *pGlobalInterfaceTable;
				CoCreateInstance(CLSID_StdGlobalInterfaceTable, NULL, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pGlobalInterfaceTable));
				ClearIconOverlayHandlers();
				TCHAR pszName[MAX_PATH * 2], pszClsid[MAX_PATH];
				DWORD dwNameSize = MAX_PATH;
				DWORD dwSize = sizeof(pszClsid);
				FILETIME ftLastWriteTime;
				HKEY hKey, hKey1;
				LPWSTR pszKey = L"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\ShellIconOverlayIdentifiers";
				lstrcpy(pszName, pszKey);
				lstrcat(pszName, L"\\");
				int nName = lstrlen(pszName);
				if (RegOpenKeyEx(HKEY_LOCAL_MACHINE, pszKey, 0, KEY_ENUMERATE_SUB_KEYS, &hKey) == ERROR_SUCCESS) {
					LONG lRet;
					for (DWORD dwIndex = g_dwBase; (lRet = RegEnumKeyEx(hKey, dwIndex, &pszName[nName], &dwNameSize, NULL, NULL, NULL, &ftLastWriteTime)) != ERROR_NO_MORE_ITEMS; ++dwIndex) {
						if (lRet == ERROR_SUCCESS) {
							if (RegOpenKeyEx(HKEY_LOCAL_MACHINE, pszName, 0, KEY_READ, &hKey1) == ERROR_SUCCESS) {
								if (RegQueryValueEx(hKey1, NULL, NULL, NULL, (LPBYTE)&pszClsid, &dwSize) == ERROR_SUCCESS) {
									CLSID clsid;
									if SUCCEEDED(CLSIDFromString(pszClsid, &clsid)) {
										IShellIconOverlayIdentifier *psio = NULL;
										if SUCCEEDED(CoCreateInstance(clsid, NULL, CLSCTX_INPROC_SERVER | CLSCTX_LOCAL_SERVER, IID_PPV_ARGS(&psio))) {
											DWORD dwCookie;
											if SUCCEEDED(pGlobalInterfaceTable->RegisterInterfaceInGlobal(psio, IID_IShellIconOverlayIdentifier, &dwCookie)) {
												g_pIconOverlayHandlers.push_back(dwCookie);
											}
											psio->Release();
										}
									}
								}
								RegCloseKey(hKey1);
							}
							dwNameSize = MAX_PATH;
						}
					}
					RegCloseKey(hKey);
					stable_sort(g_pIconOverlayHandlers.begin(), g_pIconOverlayHandlers.end(), &SortIconOverlayHandlers);
				}
				if (g_dwCookie) {
					pGlobalInterfaceTable->RevokeInterfaceFromGlobal(g_dwCookie);
				}
				pGlobalInterfaceTable->RegisterInterfaceInGlobal(pDispParams->rgvarg[nArg - 1].pdispVal, IID_IDispatch, &g_dwCookie);
				pGlobalInterfaceTable->Release();
			}
			return S_OK;

		case 0x60010001://Finalize
			Finalize();
			return S_OK;

		case 0x60010002://GetOverlayInfo
			hr = E_FAIL;
			if (nArg >= 1) {
				DWORD dwIndex = GetIntFromVariant(&pDispParams->rgvarg[nArg]);
				IUnknown *punk;
				if (FindUnknown(&pDispParams->rgvarg[nArg - 1], &punk)) {
					TCHAR pszIconFile[MAX_PATH * 2];
					int iIndex;
					DWORD dwFlags;
					if (dwIndex < g_pIconOverlayHandlers.size()) {
						IShellIconOverlayIdentifier *psio = NULL;
						IGlobalInterfaceTable *pGlobalInterfaceTable;
						CoCreateInstance(CLSID_StdGlobalInterfaceTable, NULL, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pGlobalInterfaceTable));
						if SUCCEEDED(pGlobalInterfaceTable->GetInterfaceFromGlobal(g_pIconOverlayHandlers[dwIndex], IID_PPV_ARGS(&psio))) {
							hr = psio->GetOverlayInfo(pszIconFile, sizeof(pszIconFile), &iIndex, &dwFlags);
							if SUCCEEDED(hr) {
								VARIANT v;
								teSetSZ(&v, pszIconFile);
								tePutProperty(punk, L"IconFile", &v);
								VariantClear(&v);
								teSetLong(&v, iIndex);
								tePutProperty(punk, L"Index", &v);
								VariantClear(&v);
								teSetLong(&v, dwFlags);
								tePutProperty(punk, L"dwFlags", &v);
								VariantClear(&v);
#ifdef _DEBUG
								int iPriority;
								psio->GetPriority(&iPriority);
								teSetLong(&v, iPriority);
								tePutProperty(punk, L"Priority", &v);
								VariantClear(&v);
#endif
							}
							psio->Release();
						}
						pGlobalInterfaceTable->Release();
						hr &= MAXINT;
					}
				}
			}
			teSetLong(pVarResult, hr);
			return S_OK;

		case 0x60010003://GetOverlayIconIndex
			if (nArg >= 2 && g_bAlive) {
				TEGetOverlayIcon *pGOI = new TEGetOverlayIcon[1];
				pGOI->bsPath = ::SysAllocString(GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]));
				pGOI->dwAttrib = GetIntFromVariant(&pDispParams->rgvarg[nArg - 1]);
				pGOI->Id = GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]);
				g_pIconOverlay.push_back(pGOI);
				if (::InterlockedIncrement(&g_lThreads) == 1) {
					_beginthread(&threadGetOverlayIconIndex, 0, NULL);
				} else {
					::InterlockedDecrement(&g_lThreads);
				}
			}
			/* //Sync
			int iResult;
			iResult = -1;
			if (nArg >= 2) {
				IGlobalInterfaceTable *pGlobalInterfaceTable;
				CoCreateInstance(CLSID_StdGlobalInterfaceTable, NULL, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pGlobalInterfaceTable));
				for (UINT i = 0; i < g_pIconOverlayHandlers.size(); i++) {
					IShellIconOverlayIdentifier *psio = NULL;
					pGlobalInterfaceTable->GetInterfaceFromGlobal(g_pIconOverlayHandlers[i], IID_PPV_ARGS(&psio));
					if (g_pIconOverlayHandlers[i] && psio->IsMemberOf(bsPath, dwAttrib) == S_OK) {
						psio->Release();
						iResult = i;
						break;
					}
					psio->Release();
				}
				pGlobalInterfaceTable->Release();
				teSetLong(pVarResult, iResult);
			}*/
			return S_OK;
		//this
		case DISPID_VALUE:
			teSetObject(pVarResult, this);
			return S_OK;
		}//end_switch
	} catch (...) {
		teSetLong(pVarResult, E_UNEXPECTED);
		return S_OK;
	}
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
	LockModule();
	return 2;
}

STDMETHODIMP_(ULONG) CteClassFactory::Release()
{
	UnlockModule();
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
	if (fLock) {
		LockModule();
		return S_OK;
	}
	UnlockModule();
	return S_OK;
}
