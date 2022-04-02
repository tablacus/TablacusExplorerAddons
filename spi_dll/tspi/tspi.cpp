// Tablacus Susie Plug-in Wrapper (C)2017 Gaku
// MIT Lisence
// Visual C++ 2017 Express Edition
// 32-bit Visual Studio 2015 - Windows XP (v140_xp)
// 64-bit Visual Studio 2017 (v141)
// https://tablacus.github.io/

#include "tspi.h"

// Global Variables:
const TCHAR g_szProgid[] = TEXT("Tablacus.SusiePlugin");
const TCHAR g_szClsid[] = TEXT("{211571E6-E2B9-446F-8F9F-4DFBE338CE8C}");
HINSTANCE	g_hinstDll = NULL;
CteBase		*g_pBase = NULL;
std::vector<CteSPI *> g_ppObject;
IDispatch	*g_pdispProgressProc = NULL;
LPFNGetImage lpfnGetImage = NULL;
LONG		g_lLocks = 0;
DWORD		g_dwCookie = 0;
DWORD		g_dwMainThreadId;
BOOL		g_bUseGIT = FALSE;

std::unordered_map<std::wstring, DISPID> g_umBASE = {
	{ L"open", 0x60010000 },
	{ L"clear", 0x60010001 },
	{ L"close", 0x6001000c },
	{ L"getimage", 0x4001f010 },
	{ L"getarchive", 0x4001f011 },
	{ L"setgetimage", 0x6001f012 },
	{ L"callback", 0x6001f020 },
};

std::unordered_map<std::wstring, DISPID> g_umTSPI = {
	{ L"getplugininfo", 0x60010001 },
	{ L"issupported", 0x60010002 },
	{ L"getpictureinfo", 0x60010003 },
	{ L"getpicture", 0x60010004 },
	{ L"getpreview", 0x60010005 },
	{ L"getarchiveinfo", 0x60010006 },
	{ L"getfileinfo", 0x60010007 },
	{ L"getfile", 0x60010008 },
	{ L"configurationdlg", 0x60010009 },
	{ L"filter", 0x6001f000 },
	{ L"preview", 0x6001f001 },
	{ L"sync", 0x6001f002 },
	{ L"ispreview", 0x6001f003 },
	{ L"isunicode", 0x6001ffff },
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
		::InterlockedIncrement(&g_lLocks);
	} else {
		::InterlockedDecrement(&g_lLocks);
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
		if (teVarIsNumber(pv)) {
			LONGLONG ll = 0;
			if (swscanf_s(pv->bstrVal, L"0x%016llx", &ll) > 0) {
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

VOID teSysFreeStringA(BSTRA *pbsA)
{
	teSysFreeString((BSTR *)pbsA);
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
		pv->bstrVal = ::SysAllocStringLen(NULL, 18);
		swprintf_s(pv->bstrVal, 19, L"0x%016llx", ll);
		pv->vt = VT_BSTR;
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

BSTR GetMemoryFromStream(IStream *pStream, BOOL *pbDelete, LONG_PTR *pLen)
{
	BSTR pMemory = NULL;
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
	return pMemory;
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
			pMemory = GetMemoryFromStream(pStream, pbDelete, pLen);
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
	if (!pMemory) {
		pMemory = ::SysAllocStringByteLen(NULL, 2048);
			::ZeroMemory(pMemory, 2048);
		*pbDelete = TRUE;
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

VOID teSetSusieTime(VARIANT *pv, susie_time_t t)
{
    FILETIME ft;
	ULARGE_INTEGER uli;
	uli.QuadPart = (t * 10000000LL) + 116444736000000000LL;
	ft.dwLowDateTime = uli.LowPart;
	ft.dwHighDateTime = uli.HighPart;
	if (teFileTimeToVariantTime(&ft, &pv->date)) {
		pv->vt = VT_DATE;
	}
}

VOID teSetSusieFileInfoW(IUnknown *punk, SUSIE_FINFOTW *pfinfo)
{
	if (punk) {
		VARIANT v;
		VariantClear(&v);
		teSetSZA(&v, (LPCSTR)pfinfo->method, CP_ACP);
		tePutProperty(punk, L"method", &v);
		VariantClear(&v);
		teSetPtr(&v, pfinfo->position);
		tePutProperty(punk, L"position", &v);
		VariantClear(&v);
		teSetPtr(&v, pfinfo->compsize);
		tePutProperty(punk, L"compsize", &v);
		VariantClear(&v);
		teSetPtr(&v, pfinfo->filesize);
		tePutProperty(punk, L"filesize", &v);
		VariantClear(&v);
		teSetSusieTime(&v, pfinfo->timestamp);
		tePutProperty(punk, L"timestamp", &v);
		VariantClear(&v);
		teSetSZ(&v, pfinfo->path);
		tePutProperty(punk, L"path", &v);
		VariantClear(&v);
		teSetSZ(&v, pfinfo->filename);
		tePutProperty(punk, L"filename", &v);
		VariantClear(&v);
		teSetLong(&v, pfinfo->crc);
		tePutProperty(punk, L"crc", &v);
		VariantClear(&v);
	}
}

VOID teSetSusieFileInfoA(IUnknown *punk, SUSIE_FINFO *pfinfo)
{
	if (punk) {
		VARIANT v;
		VariantClear(&v);
		teSetSZA(&v, (LPCSTR)pfinfo->method, CP_ACP);
		tePutProperty(punk, L"method", &v);
		VariantClear(&v);
		teSetPtr(&v, pfinfo->position);
		tePutProperty(punk, L"position", &v);
		VariantClear(&v);
		teSetPtr(&v, pfinfo->compsize);
		tePutProperty(punk, L"compsize", &v);
		VariantClear(&v);
		teSetPtr(&v, pfinfo->filesize);
		tePutProperty(punk, L"filesize", &v);
		VariantClear(&v);
		teSetSusieTime(&v, pfinfo->timestamp);
		tePutProperty(punk, L"timestamp", &v);
		VariantClear(&v);
		teSetSZA(&v, pfinfo->path, CP_ACP);
		tePutProperty(punk, L"path", &v);
		VariantClear(&v);
		teSetSZA(&v, pfinfo->filename, CP_ACP);
		tePutProperty(punk, L"filename", &v);
		VariantClear(&v);
		teSetLong(&v, pfinfo->crc);
		tePutProperty(punk, L"crc", &v);
		VariantClear(&v);
	}
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

int __stdcall tspi_ProgressCallback(int nNum, int nDenom, LONG_PTR lData)
{
	if (g_pdispProgressProc) {
		VARIANT vResult;
		VariantInit(&vResult);
		VARIANTARG *pv = GetNewVARIANT(3);
		teSetLong(&pv[2], nNum);
		teSetLong(&pv[1], nDenom);
		teSetPtr(&pv[0], lData);
		if SUCCEEDED(Invoke4(g_pdispProgressProc, &vResult, 3, pv)) {
			return GetIntFromVariantClear(&vResult);
		}
	}
	return SPI_ALL_RIGHT;
}

int __stdcall tspi_ProgressCallback2(int nNum, int nDenom, LONG_PTR lData)
{
	return SPI_ALL_RIGHT;
}

VOID teVariantChangeType(__out VARIANTARG * pvargDest,
				__in const VARIANTARG * pvarSrc, __in VARTYPE vt)
{
	VariantInit(pvargDest);
	if FAILED(VariantChangeType(pvargDest, pvarSrc, 0, vt)) {
		pvargDest->llVal = 0;
	}
}

BSTRA teWide2Ansi(LPCWSTR lpW, int nLenW)
{
	if (lpW) {
		int nLenA = WideCharToMultiByte(CP_ACP, 0, lpW, nLenW, NULL, 0, NULL, NULL);
		LPSTR bsA = (LPSTR)::SysAllocStringByteLen(NULL, nLenA);
		WideCharToMultiByte(CP_ACP, 0, lpW, nLenW, bsA, nLenA, NULL, NULL);
		return bsA;
	}
	return NULL;
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
			g_dwMainThreadId = GetCurrentThreadId();
			break;
		case DLL_PROCESS_DETACH:
			if (g_bUseGIT) {
				IGlobalInterfaceTable *pGlobalInterfaceTable;
				CoCreateInstance(CLSID_StdGlobalInterfaceTable, NULL, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pGlobalInterfaceTable));
				pGlobalInterfaceTable->RevokeInterfaceFromGlobal(g_dwCookie);
				pGlobalInterfaceTable->Release();
			}
			for (size_t i = g_ppObject.size(); i--;) {
				SafeRelease(&g_ppObject[i]);
			}
			g_ppObject.clear();
			SafeRelease(&g_pBase);
			SafeRelease(&g_pdispProgressProc);
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

HRESULT Synchronize(int nMode, size_t i, LONG_PTR arg)
{
	HRESULT hr = E_NOTIMPL;
	IDispatch *pdisp = NULL;
	IGlobalInterfaceTable *pGlobalInterfaceTable;
	CoCreateInstance(CLSID_StdGlobalInterfaceTable, NULL, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pGlobalInterfaceTable));
	if SUCCEEDED(pGlobalInterfaceTable->GetInterfaceFromGlobal(g_dwCookie, IID_PPV_ARGS(&pdisp))) {
		VARIANT v;
		VARIANTARG *pv = GetNewVARIANT(3);
		teSetLong(&pv[2], nMode);
		teSetPtr(&pv[1], i);
		teSetPtr(&pv[0], arg);
		if (teExecMethod(pdisp, L"Callback", &v, 3, pv) == S_OK) {
			hr = GetIntFromVariantClear(&v);
		}
		pdisp->Release();
	}
	pGlobalInterfaceTable->Release();
	return hr;
}

//GetArchive
HRESULT WINAPI GetArchive(LPCWSTR lpszArcPath, LPCWSTR lpszItem, IStream **ppStream, LPVOID lpReserved)
{
	HRESULT hr = E_NOTIMPL;
	LockModule(TRUE);
	try {
		TEGetArchiveArg arg;
		arg.lpszArcPath = lpszArcPath;
		arg.lpszItem = lpszItem;
		arg.ppStream = ppStream;
		arg.bDelete = FALSE;
		arg.pdw = NULL;
		arg.bsPathA = NULL;
		arg.bsItemA = NULL;
		for (size_t i = 0; hr == E_NOTIMPL && i < g_ppObject.size(); i++) {
			CteSPI *pSPI = g_ppObject[i];
			if (PathMatchSpec(arg.lpszArcPath, pSPI->m_bsFilter)) {
				if (pSPI->m_bSync && g_dwMainThreadId != GetCurrentThreadId()) {
					hr = Synchronize(0, i, (LONG_PTR)&arg);
				} else {
					hr = pSPI->GetArchive(&arg);
				}
			}
		}
		if (arg.bDelete) {
			teSysFreeString(&arg.pdw);
		}
		teSysFreeStringA(&arg.bsItemA);
		teSysFreeStringA(&arg.bsPathA);
	} catch (...) {}
	LockModule(FALSE);
	return hr;
}

//GetImage
HRESULT WINAPI GetImage(IStream *pStream, LPWSTR lpPath, int cx, HBITMAP *phBM, int *pnAlpha)
{
	HRESULT hr = E_NOTIMPL;
	LockModule(TRUE);
	try {
		TEGetImageArg arg;
		arg.pStream = pStream;
		arg.lpPath = lpPath;
		arg.cx = cx;
		arg.phBM = phBM;
		arg.pnAlpha = pnAlpha;
		arg.bsPathA = NULL;
		arg.len = 0;
		arg.bDelete = FALSE;
		arg.pdw = NULL;
		for (size_t i = 0; hr == E_NOTIMPL && i < g_ppObject.size(); i++) {
			CteSPI *pSPI = g_ppObject[i];
			if (PathMatchSpec(arg.lpPath, pSPI->m_bsFilter)) {
				if (pSPI->m_bSync && g_dwMainThreadId != GetCurrentThreadId()) {
					hr = Synchronize(1, i, (LONG_PTR)&arg);
				} else {
					hr = pSPI->GetImage(&arg);
				}
			}
		}
		if (arg.bDelete) {
			teSysFreeString(&arg.pdw);
		}
		teSysFreeStringA(&arg.bsPathA);
	} catch (...) {}
	LockModule(FALSE);
	return hr;
}

//CteSPI

CteSPI::CteSPI(HMODULE hDll, LPWSTR lpLib)
{
	m_cRef = 1;
	m_hDll = hDll;
	m_bsLib = ::SysAllocString(lpLib);
	m_bsFilter = NULL;
	m_bsPreview = NULL;
	m_bSync = FALSE;
	m_bIsPreview = FALSE;
	m_bIsUnicode = TRUE;

	teGetProcAddress(m_hDll, "GetPluginInfo", (FARPROC *)&GetPluginInfo, (FARPROC *)&GetPluginInfoW);
	teGetProcAddress(m_hDll, "IsSupported", (FARPROC *)&IsSupported, (FARPROC *)&IsSupportedW);
	teGetProcAddress(m_hDll, "GetPictureInfo", (FARPROC *)&GetPictureInfo, (FARPROC *)&GetPictureInfoW);
	teGetProcAddress(m_hDll, "GetPicture", (FARPROC *)&GetPicture, (FARPROC *)&GetPictureW);
	teGetProcAddress(m_hDll, "GetPreview", (FARPROC *)&GetPreview, (FARPROC *)&GetPreviewW);
	teGetProcAddress(m_hDll, "GetArchiveInfo", (FARPROC *)&GetArchiveInfo, (FARPROC *)&GetArchiveInfoW);
	teGetProcAddress(m_hDll, "GetFileInfo", (FARPROC *)&GetFileInfo, (FARPROC *)&GetFileInfoW);
	teGetProcAddress(m_hDll, "GetFile", (FARPROC *)&GetFile, (FARPROC *)&GetFileW);
	teGetProcAddress(m_hDll, "ConfigurationDlg", (FARPROC *)&ConfigurationDlg, NULL);
}

CteSPI::~CteSPI()
{
	Close();
	for (size_t i = g_ppObject.size(); i--;) {
		if (this == g_ppObject[i]) {
			g_ppObject.erase(g_ppObject.begin() + i);
			break;
		}
	}
}

VOID CteSPI::Close()
{
	teSysFreeString(&m_bsFilter);
	if (m_hDll) {
		FreeLibrary(m_hDll);
		m_hDll = NULL;
	}
	GetPluginInfo = NULL;
	IsSupported = NULL;
	GetPictureInfo = NULL;
	GetPicture = NULL;
	GetPreview = NULL;
	GetArchiveInfo = NULL;
	GetFileInfo = NULL;
	GetFile = NULL;
	ConfigurationDlg = NULL;
}

HLOCAL CteSPI::GetArchiveInfoX(LPCWSTR lpszArcPath, BOOL bDelete, BSTRA *pbsPathA, void *pdw,
							   LONG_PTR len, int flag, SUSIE_FINFOTW **ppfinfoW, SUSIE_FINFO **ppfinfo) {
	HLOCAL hInfo = NULL;
	if (m_bIsUnicode && GetArchiveInfoW && IsSupportedW) {
		if (!pdw || IsSupportedW(lpszArcPath, pdw)) {
			try {
				GetArchiveInfoW(lpszArcPath, len, flag, &hInfo);
			} catch (...) {
				IsSupportedW = NULL;
			}
			if (hInfo) {
				UINT lSize = LocalSize(hInfo);
				if ((lSize % sizeof(SUSIE_FINFOTW)) == 0 || (lSize % sizeof(SUSIE_FINFO))) {
					*ppfinfoW = (SUSIE_FINFOTW *)LocalLock(hInfo);
				} else {
					*ppfinfo = (SUSIE_FINFO *)LocalLock(hInfo);
				}
			}
		}
	} else if (GetArchiveInfo && IsSupported) {
		if (!pdw || IsSupported(*pbsPathA, pdw)) {
			if (bDelete) {
				try {
					GetArchiveInfo((LPSTR)lpszArcPath, len, flag, &hInfo);
				} catch (...) {
					IsSupported = NULL;
				}
			} else {
				if (!*pbsPathA) {
					*pbsPathA = teWide2Ansi(lpszArcPath, -1);
				}
				try {
					GetArchiveInfo(*pbsPathA, len, flag, &hInfo);
				} catch (...) {
					IsSupported = NULL;
				}
			}
 			if (hInfo) {
				*ppfinfo = (SUSIE_FINFO *)LocalLock(hInfo);
			}
		}
	}
	return hInfo;
}

int CteSPI::GetFileInfoX(LPCWSTR lpszArcPath, LPCWSTR lpszItem, BOOL bDelete, BSTRA *pbsPathA, BSTRA *pbsItemA, void *pdw,
						 LONG_PTR len, int flag, SUSIE_FINFOTW *pfinfoW, SUSIE_FINFO *pfinfo, BOOL *pbUnicode)
{
	int iResult = SPI_NO_FUNCTION;
	if (m_bIsUnicode && GetFileInfoW && IsSupportedW) {
		if (!pdw || IsSupportedW(lpszArcPath, pdw)) {
			try {
				iResult = GetFileInfoW(lpszArcPath, len, lpszItem, flag, pfinfoW);
			} catch (...) {
				IsSupportedW = NULL;
				iResult = SPI_OTHER_ERROR;
			}
			*pbUnicode = TRUE;
			if (lstrcmpi(PathFindFileName(lpszItem), PathFindFileName(pfinfoW->filename))) {
				iResult = SPI_NO_FUNCTION;
			}
		}
	} else if (GetFileInfo && IsSupported) {
		if (!*pbsItemA) {
			*pbsItemA = teWide2Ansi(lpszItem, -1);
		}
		if (!pdw || IsSupported(*pbsItemA, pdw)) {
			if (bDelete) {
				try {
					iResult = GetFileInfo((LPSTR)lpszArcPath, len, (LPCSTR)*pbsItemA, flag, pfinfo);
				} catch (...) {
					IsSupported = NULL;
					iResult = SPI_OTHER_ERROR;
				}
			} else {
				if (!*pbsPathA) {
					*pbsPathA = teWide2Ansi(lpszArcPath, -1);
				}
				try {
					iResult = GetFileInfo(*pbsPathA, len, (LPCSTR)*pbsItemA, flag, pfinfo);
				} catch (...) {
					IsSupported = NULL;
					iResult = SPI_OTHER_ERROR;
				}
				*pbUnicode = FALSE;
				if (StrCmpIA(PathFindFileNameA(*pbsItemA), PathFindFileNameA(pfinfo->filename))) {
					iResult = SPI_NO_FUNCTION;
				}
			}
		}
	}
	if (iResult != SPI_NO_FUNCTION) {
		return iResult;
	}
	SUSIE_FINFOTW *pfinfoW1 = NULL;
	SUSIE_FINFO *pfinfo1 = NULL;
	HLOCAL hInfo = GetArchiveInfoX(lpszArcPath, bDelete, pbsPathA, NULL, len, flag, &pfinfoW1, &pfinfo1);
 	if (hInfo) {
		if (pfinfoW1) {
			try {
				for (int i = 0; pfinfoW1[i].method[0]; i++) {
					WCHAR pszPath[400];
					lstrcpy(pszPath, pfinfoW1[i].path);
					PathAppend(pszPath, pfinfoW1[i].filename);
					if (lstrcmpi(lpszItem, pszPath) == 0) {
						iResult = SPI_ALL_RIGHT;
						CopyMemory(pfinfoW, &pfinfoW1[i], sizeof(SUSIE_FINFOTW));
						break;
					}
				}
				if (iResult != SPI_ALL_RIGHT) {
					for (int i = 0; pfinfoW1[i].method[0]; i++) {
						if (lstrcmpi(lpszItem, pfinfoW1[i].filename) == 0) {
							iResult = SPI_ALL_RIGHT;
							CopyMemory(pfinfoW, &pfinfoW1[i], sizeof(SUSIE_FINFOTW));
							break;
						}
					}
				}
			} catch (...) {}
			LocalUnlock(hInfo);
			*pbUnicode = TRUE;
		}
		if (pfinfo1) {
			try {
				if (!*pbsItemA) {
					*pbsItemA = teWide2Ansi(lpszItem, -1);
				}
				for (int i = 0; pfinfo1[i].method[0]; i++) {
					CHAR pszPathA[400];
					StrCpyA(pszPathA, pfinfo1[i].path);
					PathAppendA(pszPathA, pfinfo1[i].filename);
					if (StrCmpIA(*pbsItemA, pszPathA) == 0) {
						iResult = SPI_ALL_RIGHT;
						*pbUnicode = FALSE;
						CopyMemory(pfinfo, &pfinfo1[i], sizeof(SUSIE_FINFO));
						break;
					}
				}
				if (iResult != SPI_ALL_RIGHT) {
					for (int i = 0; pfinfo1[i].method[0]; i++) {
						if (StrCmpIA(*pbsItemA, pfinfo1[i].filename) == 0) {
							iResult = SPI_ALL_RIGHT;
							*pbUnicode = FALSE;
							CopyMemory(pfinfo, &pfinfo1[i], sizeof(SUSIE_FINFO));
							break;
						}
					}
				}
			} catch (...) {}
			LocalUnlock(hInfo);
			*pbUnicode = FALSE;
		}
		LocalFree(hInfo);
	}
	return iResult;
}

//GetArchive
HRESULT CteSPI::GetArchive(TEGetArchiveArg *pArg)
{
	HRESULT hr = E_NOTIMPL;
	if (IsSupported) {
		//AM
		if (GetFile) {
			if (!pArg->pdw) {
				IStream *pStream;
				if SUCCEEDED(SHCreateStreamOnFileEx(pArg->lpszArcPath, STGM_READ | STGM_SHARE_DENY_NONE, FILE_ATTRIBUTE_NORMAL, false, NULL, &pStream)) {
					pArg->pdw = GetMemoryFromStream(pStream, &pArg->bDelete, NULL);
					SafeRelease(&pStream);
				} else {
					return STG_E_FILENOTFOUND;
				}
			}
			HLOCAL hLocal = NULL;
			SUSIE_FINFOTW finfoW;
			SUSIE_FINFO finfo;
			BOOL bUnicode;
			if (GetFileInfoX(pArg->lpszArcPath, pArg->lpszItem, FALSE, &pArg->bsPathA, &pArg->bsItemA, pArg->pdw, 0, 0x80, &finfoW, &finfo, &bUnicode) == SPI_ALL_RIGHT) {
				if (bUnicode) {
					GetFileW(pArg->lpszArcPath, finfoW.position, (LPWSTR)&hLocal, 0x100, tspi_ProgressCallback2, 0);
				} else {
					GetFile(pArg->bsPathA, finfo.position, (LPSTR)&hLocal, 0x100, tspi_ProgressCallback2, 0);
				}
			}
			if (hLocal) {
				UINT lSize = LocalSize(hLocal);
				PBYTE lpData = (PBYTE)LocalLock(hLocal);
				if (lpData) {
					*pArg->ppStream = SHCreateMemStream(lpData, lSize);
					LocalUnlock(hLocal);
				}
				LocalFree(hLocal);
				hr = *pArg->ppStream ? S_OK : E_OUTOFMEMORY;
			}
		}
	}	
	return hr;
}

//GetImage
HRESULT CteSPI::GetImage(TEGetImageArg *pArg)
{
	HRESULT hr = E_NOTIMPL;
	if (IsSupported) {
		//IN
		if (GetPicture) {
			HLOCAL hInfo = NULL;
			HLOCAL hBMData = NULL;
			if (!pArg->pdw) {
				pArg->pdw = GetMemoryFromStream(pArg->pStream, &pArg->bDelete, NULL);
			}
			int iResult = SPI_NO_FUNCTION;
			if (m_bIsUnicode && IsSupportedW && GetPictureW) {
				if (IsSupportedW(pArg->lpPath, (void *)pArg->pdw)) {
					if (PathMatchSpec(pArg->lpPath, L"?:\\*;\\\\*")) {
						if (m_bIsPreview && GetPreviewW && (pArg->cx && pArg->cx < 256) && PathMatchSpec(pArg->lpPath, m_bsPreview)) {
							iResult = GetPreviewW(pArg->lpPath, 0, 0, &hInfo, &hBMData, tspi_ProgressCallback2, 1);
						}
						if (iResult != SPI_ALL_RIGHT) {
							iResult = GetPictureW(pArg->lpPath, 0, 0, &hInfo, &hBMData, tspi_ProgressCallback2, 0);
						}
					} else {
						if (pArg->len == 0) {
							teSysFreeString(&pArg->pdw);
							pArg->pdw = GetMemoryFromStream(pArg->pStream, &pArg->bDelete, &pArg->len);
						}
						if (m_bIsPreview && GetPreviewW && (pArg->cx && pArg->cx < 256) && PathMatchSpec(pArg->lpPath, m_bsPreview)) {
							iResult = GetPreviewW(pArg->pdw, pArg->len, 1, &hInfo, &hBMData, tspi_ProgressCallback2, 1);
						}
						if (iResult != SPI_ALL_RIGHT) {
							iResult = GetPictureW(pArg->pdw, pArg->len, 1, &hInfo, &hBMData, tspi_ProgressCallback2, 0);
						}
					}
				}
			}
			if (iResult != SPI_ALL_RIGHT && IsSupported) {
				if (!pArg->bsPathA) {
					pArg->bsPathA = teWide2Ansi(pArg->lpPath, -1);
				}
				if (IsSupported(pArg->bsPathA, (void *)pArg->pdw)) {
					if (PathMatchSpec(pArg->lpPath, L"?:\\*;\\\\*") && !StrChrA(pArg->bsPathA, '?')) {
						if (m_bIsPreview && GetPreview && (pArg->cx && pArg->cx < 256) && PathMatchSpec(pArg->lpPath, m_bsPreview)) {
							iResult = GetPreview(pArg->bsPathA, 0, 0, &hInfo, &hBMData, tspi_ProgressCallback2, 1);
						}
						if (iResult != SPI_ALL_RIGHT) {
							iResult = GetPicture(pArg->bsPathA, 0, 0, &hInfo, &hBMData, tspi_ProgressCallback2, 0);
						}
					} else {
						if (pArg->len == 0) {
							teSysFreeString(&pArg->pdw);
							pArg->pdw = GetMemoryFromStream(pArg->pStream, &pArg->bDelete, &pArg->len);
						}
						if (m_bIsPreview && GetPreview && (pArg->cx && pArg->cx < 256) && PathMatchSpec(pArg->lpPath, m_bsPreview)) {
							iResult = GetPreview((LPSTR)pArg->pdw, pArg->len, 1, &hInfo, &hBMData, tspi_ProgressCallback2, 1);
						}
						if (iResult != SPI_ALL_RIGHT) {
							iResult = GetPicture((LPSTR)pArg->pdw, pArg->len, 1, &hInfo, &hBMData, tspi_ProgressCallback2, 0);
						}
					}
				}
			}
			if (iResult == SPI_ALL_RIGHT) {
				PBITMAPINFO lpbmi = (PBITMAPINFO)LocalLock(hInfo);
				if (lpbmi) {
					try {
						*pArg->phBM =  CreateDIBSection(NULL, lpbmi, DIB_RGB_COLORS, NULL, NULL, 0);
						if (*pArg->phBM) {
							PBYTE lpbm = (PBYTE)LocalLock(hBMData);
							if (lpbm) {
								SetDIBits(NULL, *pArg->phBM, 0, lpbmi->bmiHeader.biHeight, lpbm, lpbmi, DIB_RGB_COLORS);
								*pArg->pnAlpha = 0;
								hr = S_OK;
								LocalUnlock(hBMData);
							}
							LocalFree(hBMData);
						}
					} catch (...) {}
					LocalUnlock(hInfo);
				}
				LocalFree(hInfo);
			}
			return hr;
		}
		//AM
		if (GetFile && m_bIsPreview && PathMatchSpec(pArg->lpPath, L"?:\\*;\\\\*")) {
			int iResult = SPI_NO_FUNCTION;
			if (!pArg->pdw) {
				pArg->pdw = GetMemoryFromStream(pArg->pStream, &pArg->bDelete, NULL);
			}
			HLOCAL hLocal = NULL;
			BSTR bsInfo = NULL;
			try {
				SUSIE_FINFOTW *pfinfoW = NULL;
				SUSIE_FINFO *pfinfo = NULL;
				HLOCAL hInfo = GetArchiveInfoX(pArg->lpPath, FALSE, &pArg->bsPathA, (void *)pArg->pdw, 0, 0, &pfinfoW, &pfinfo);
				if (hInfo) {
					if (pfinfoW && GetFileW) {
						try {
							for (int j = 0; pfinfoW[j].method[0]; j++) {
								teSysFreeString(&bsInfo);
								bsInfo = ::SysAllocString(pfinfoW[j].filename);
								if (PathMatchSpec(bsInfo, m_bsPreview)) {
									GetFileW(pArg->lpPath, pfinfoW[j].position, (LPWSTR)&hLocal, 0x100, tspi_ProgressCallback2, 2);
									if (hLocal) {
										break;
									}
								}
							}
						} catch (...) {}
						LocalUnlock(hInfo);
					}
					if (pfinfo && GetFile) {
						try {
							for (int j = 0; pfinfo[j].method[0]; j++) {
								teSysFreeString(&bsInfo);
								int nLenW = MultiByteToWideChar(CP_ACP, 0, pfinfo[j].filename, -1, NULL, NULL);
								if (nLenW) {
									bsInfo = ::SysAllocStringLen(NULL, nLenW - 1);
									MultiByteToWideChar(CP_ACP, 0, pfinfo[j].filename, -1, bsInfo, nLenW);
								}
								if (PathMatchSpec(bsInfo, m_bsPreview)) {
									GetFile(pArg->bsPathA, pfinfo[j].position, (LPSTR)&hLocal, 0x100, tspi_ProgressCallback2, 2);
									if (hLocal) {
										break;
									}
								}
							}
						} catch (...) {}
						LocalUnlock(hInfo);
					}
					LocalFree(hInfo);
				}
			} catch (...) {
				hLocal = NULL;
			}
			if (hLocal) {
				IStream *pStreamOut = NULL;
				UINT lSize = LocalSize(hLocal);
				PBYTE lpData = (PBYTE)LocalLock(hLocal);
				if (lpData) {
					pStreamOut = SHCreateMemStream(lpData, lSize);
					LocalUnlock(hLocal);
				}
				LocalFree(hLocal);
				if (pStreamOut) {
					if (lpfnGetImage(pStreamOut, bsInfo, pArg->cx, pArg->phBM, pArg->pnAlpha) == S_OK) {
						hr = S_OK;
					}
					pStreamOut->Release();
				}
			}
			teSysFreeString(&bsInfo);
		}
	}
	return hr;
}

STDMETHODIMP CteSPI::QueryInterface(REFIID riid, void **ppvObject)
{
	static const QITAB qit[] =
	{
		QITABENT(CteSPI, IDispatch),
		{ 0 },
	};
	return QISearch(this, qit, riid, ppvObject);
}

STDMETHODIMP_(ULONG) CteSPI::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteSPI::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}
	return m_cRef;
}

STDMETHODIMP CteSPI::GetTypeInfoCount(UINT *pctinfo)
{
	*pctinfo = 0;
	return S_OK;
}

STDMETHODIMP CteSPI::GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo)
{
	return E_NOTIMPL;
}

STDMETHODIMP CteSPI::GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId)
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

STDMETHODIMP CteSPI::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	int iResult = SPI_NO_FUNCTION;
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;
	try {
		switch (dispIdMember) {
			case 0x60010001://GetPluginInfo
				if (nArg >= 0) {
					IUnknown *punk;
					if (FindUnknown(&pDispParams->rgvarg[nArg], &punk)) {
						VARIANT v;
						VariantInit(&v);
						BOOL bLoop = TRUE;
						WCHAR pszBuf[SIZE_BUFF];
						for (int i = 0; bLoop; i++) {
							if (m_bIsUnicode && GetPluginInfoW) {
								if (GetPluginInfoW(i, pszBuf, SIZE_BUFF)) {
									teSetSZ(&v, pszBuf);
								}
							} else if (GetPluginInfo) {
								if (GetPluginInfo(i, (LPSTR)pszBuf, SIZE_BUFF)) {
									teSetSZA(&v, (LPCSTR)pszBuf, CP_ACP);
								}
							}
							bLoop = v.vt == VT_BSTR;
							if (bLoop) {
								wsprintf(pszBuf, L"%d", i);
								tePutProperty(punk, pszBuf, &v);
							}
							VariantClear(&v);
						}
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (GetPluginInfoW || GetPluginInfo) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			case 0x60010002://IsSupported
				if (nArg >= 1) {
					LPWSTR lpPath = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
					BOOL bDelete = FALSE;
					BSTR pdw = GetMemoryFromVariant(&pDispParams->rgvarg[nArg - 1], &bDelete, NULL);
					iResult = 0;
					if (m_bIsUnicode && IsSupportedW) {
						iResult = IsSupportedW(lpPath, (void *)pdw);
					} else if (IsSupported) {
						BSTRA bsPathA = teWide2Ansi(lpPath, -1);
						iResult = IsSupported(bsPathA, (void *)pdw);
						teSysFreeStringA(&bsPathA);
					}
					if (bDelete) {
						teSysFreeString(&pdw);
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (IsSupportedW || IsSupported) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			case 0x60010003://GetPictureInfo
				if (nArg >= 3) {
					BOOL bDelete = FALSE;
					LONG_PTR len = GetPtrFromVariant(&pDispParams->rgvarg[nArg - 1]);
					BSTR lpBuf = GetMemoryFromVariant(&pDispParams->rgvarg[nArg], &bDelete, &len);
					int flag = GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]);
					IUnknown *punk;
					if (FindUnknown(&pDispParams->rgvarg[nArg - 3], &punk)) {
						PictureInfo Info;
						if (m_bIsUnicode && GetPictureInfoW) {
							iResult = GetPictureInfoW(lpBuf, len, flag, &Info);
						} else if (GetPictureInfo) {
							if (bDelete) {
								iResult = GetPictureInfo((LPSTR)lpBuf, len, flag, &Info);
							} else {
								LPSTR bsBufA = teWide2Ansi(lpBuf, -1);
								iResult = GetPictureInfo(bsBufA, len, flag, &Info);
								teSysFreeStringA(&bsBufA);
							}
						}
						if (iResult == SPI_ALL_RIGHT) {
							VARIANT v;
							VariantInit(&v);
							teSetLong(&v, Info.left);
							tePutProperty(punk, L"left", &v);
							VariantClear(&v);
							teSetLong(&v, Info.top);
							tePutProperty(punk, L"top", &v);
							VariantClear(&v);
							teSetLong(&v, Info.width);
							tePutProperty(punk, L"width", &v);
							VariantClear(&v);
							teSetLong(&v, Info.height);
							tePutProperty(punk, L"height", &v);
							VariantClear(&v);
							teSetLong(&v, Info.x_density);
							tePutProperty(punk, L"x_density", &v);
							VariantClear(&v);
							teSetLong(&v, Info.y_density);
							tePutProperty(punk, L"y_density", &v);
							VariantClear(&v);
							teSetLong(&v, Info.colorDepth);
							tePutProperty(punk, L"colorDepth", &v);
							VariantClear(&v);
							if (Info.hInfo) {
								teSetSZA(&v, (LPCSTR)Info.hInfo, CP_ACP);
								LocalFree(Info.hInfo);
							}
							tePutProperty(punk, L"hInfo", &v);
							VariantClear(&v);
						}
					}
					if (bDelete) {
						teSysFreeString(&lpBuf);
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (GetPictureInfoW || GetPictureInfo) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			case 0x60010004://GetPicture
			case 0x60010005://GetPreview
				if (nArg >= 6) {
					BOOL bDelete = FALSE;
					LONG_PTR len = GetPtrFromVariant(&pDispParams->rgvarg[nArg - 1]);
					BSTR lpBuf = GetMemoryFromVariant(&pDispParams->rgvarg[nArg],  &bDelete, &len);
					int flag = GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]);
					int lData = GetIntFromVariant(&pDispParams->rgvarg[nArg - 6]);
					IUnknown *punkBM;
					if (FindUnknown(&pDispParams->rgvarg[nArg - 4], &punkBM)) {
						IDispatch *pdispInfo = NULL;
						GetDispatch(&pDispParams->rgvarg[nArg - 3], &pdispInfo);
						SafeRelease(&g_pdispProgressProc);
						GetDispatch(&pDispParams->rgvarg[nArg - 5], &g_pdispProgressProc);
						HLOCAL hInfo = NULL;
						HLOCAL hBMData = NULL;
						if (dispIdMember == 0x60010004 && m_bIsUnicode && GetPictureW) {
							iResult = GetPictureW(lpBuf, len, flag, &hInfo, &hBMData, tspi_ProgressCallback, lData);
						} else if (dispIdMember == 0x60010005 && m_bIsUnicode && GetPreviewW) {
							iResult = GetPreviewW(lpBuf, len, flag, &hInfo, &hBMData, tspi_ProgressCallback, lData);
						} else if (dispIdMember == 0x60010004 && GetPicture) {
							if (bDelete) {
								iResult = GetPicture((LPSTR)lpBuf, len, flag, &hInfo, &hBMData, tspi_ProgressCallback, lData);
							} else {
								LPSTR bsBufA = teWide2Ansi(lpBuf, -1);
								iResult = GetPicture(bsBufA, len, flag, &hInfo, &hBMData, tspi_ProgressCallback, lData);
								teSysFreeStringA(&bsBufA);
							}
						} else if (dispIdMember == 0x60010005 && m_bIsUnicode && GetPreview) {
							if (bDelete) {
								iResult = GetPreview((LPSTR)lpBuf, len, flag, &hInfo, &hBMData, NULL, lData);
							} else {
								LPSTR bsBufA = teWide2Ansi(lpBuf, -1);
								iResult = GetPreview(bsBufA, len, flag, &hInfo, &hBMData, NULL, lData);
								teSysFreeStringA(&bsBufA);
							}
						}
						VARIANT v, vX;
						VariantInit(&vX);
						VariantInit(&v);
						if (iResult == SPI_ALL_RIGHT) {
							PBITMAPINFO lpbmi = (PBITMAPINFO)LocalLock(hInfo);
							if (lpbmi) {
								try {
									HBITMAP hBM =  CreateDIBSection(NULL, lpbmi, DIB_RGB_COLORS, NULL, NULL, 0);
									if (hBM) {
										PBYTE lpbm = (PBYTE)LocalLock(hBMData);
										if (lpbm) {
											SetDIBits(NULL, hBM, 0, lpbmi->bmiHeader.biHeight, lpbm, lpbmi, DIB_RGB_COLORS);
											LocalUnlock(hBMData);
										}
										LocalFree(hBMData);
									}
									teSetPtr(&v, hBM);
									tePutProperty(punkBM, L"0",  &v);
									VariantClear(&v);
									if (pdispInfo) {
										if SUCCEEDED(teGetProperty(pdispInfo, L"bmiHeader", &vX)) {
											teSetLong(&v, lpbmi->bmiHeader.biSize);
											tePutProperty(vX.punkVal, L"biSize", &v);
											VariantClear(&v);
											teSetLong(&v, lpbmi->bmiHeader.biWidth);
											tePutProperty(vX.punkVal, L"biWidth", &v);
											VariantClear(&v);
											teSetLong(&v, lpbmi->bmiHeader.biHeight);
											tePutProperty(vX.punkVal, L"biHeight", &v);
											VariantClear(&v);
											teSetLong(&v, lpbmi->bmiHeader.biPlanes);
											tePutProperty(vX.punkVal, L"biPlanes", &v);
											VariantClear(&v);
											teSetLong(&v, lpbmi->bmiHeader.biBitCount);
											tePutProperty(vX.punkVal, L"biBitCount", &v);
											VariantClear(&v);
											teSetLong(&v, lpbmi->bmiHeader.biCompression);
											tePutProperty(vX.punkVal, L"biCompression", &v);
											VariantClear(&v);
											teSetLong(&v, lpbmi->bmiHeader.biSizeImage);
											tePutProperty(vX.punkVal, L"biSizeImage", &v);
											VariantClear(&v);
											teSetLong(&v, lpbmi->bmiHeader.biXPelsPerMeter);
											tePutProperty(vX.punkVal, L"biXPelsPerMeter", &v);
											VariantClear(&v);
											teSetLong(&v, lpbmi->bmiHeader.biYPelsPerMeter);
											tePutProperty(vX.punkVal, L"biYPelsPerMeter", &v);
											VariantClear(&v);
											teSetLong(&v, lpbmi->bmiHeader.biClrUsed);
											tePutProperty(vX.punkVal, L"biClrUsed", &v);
											VariantClear(&v);
											teSetLong(&v, lpbmi->bmiHeader.biClrImportant);
											tePutProperty(vX.punkVal, L"biClrImportant", &v);
											VariantClear(&v);
											VariantClear(&vX);
										}
										if SUCCEEDED(teGetProperty(pdispInfo, L"bmiColors", &vX)) {
											WCHAR pszBuf[9];
											for (DWORD i = 0; i < lpbmi->bmiHeader.biClrUsed; i++) {
												wsprintf(pszBuf, L"%d", i);
												teSetLong(&v, *(LONG *)&lpbmi->bmiColors[i]);
												tePutProperty(vX.punkVal, pszBuf, &v);
												VariantClear(&v);
											}
											VariantClear(&vX);
										}
									}
								} catch (...) {}
								LocalUnlock(hInfo);
							}
							LocalFree(hInfo);
						}
						SafeRelease(&pdispInfo);
						teSetLong(pVarResult, iResult);
					}
					if (bDelete) {
						teSysFreeString(&lpBuf);
					}
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (dispIdMember == 0x60010004 ? GetPictureInfoW || GetPictureInfo : GetPreviewW || GetPreview) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			case 0x60010006://GetArchiveInfo
				if (nArg >= 4) {
					BOOL bDelete = FALSE;
					BSTRA bsPathA = NULL;
					LONG_PTR len = GetPtrFromVariant(&pDispParams->rgvarg[nArg - 1]);
					BSTR lpszArcPath = GetMemoryFromVariant(&pDispParams->rgvarg[nArg], &bDelete, &len);
					int flag = GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]);
					IDispatch *pList;
					if (GetDispatch(&pDispParams->rgvarg[nArg - 3], &pList)) {
						IDispatch *pdisp;
						if (GetDispatch(&pDispParams->rgvarg[nArg - 4], &pdisp)) {
							VARIANT v;
							VariantInit(&v);
							SUSIE_FINFOTW *pfinfoW = NULL;
							SUSIE_FINFO *pfinfo = NULL;
							HLOCAL hInfo = GetArchiveInfoX(lpszArcPath, bDelete, &bsPathA, NULL, len, flag, &pfinfoW, &pfinfo);
							teSysFreeStringA(&bsPathA);
 							if (hInfo) {
								if (pfinfoW) {
									try {
										for (int i = 0; pfinfoW[i].method[0]; i++) {
											if SUCCEEDED(Invoke5(pdisp, DISPID_VALUE, DISPATCH_METHOD, &v, 0, NULL)) {
												if (v.vt == VT_DISPATCH) {
													teSetSusieFileInfoW(v.pdispVal, &pfinfoW[i]);
													teExecMethod(pList, L"push", NULL, -1, &v);
													VariantClear(&v);
												}
											}
										}
									} catch (...) {}
									LocalUnlock(hInfo);
								}
								if (pfinfo) {
									try {
										for (int i = 0; pfinfo[i].method[0]; i++) {
											if SUCCEEDED(Invoke5(pdisp, DISPID_VALUE, DISPATCH_METHOD, &v, 0, NULL)) {
												if (v.vt == VT_DISPATCH) {
													teSetSusieFileInfoA(v.pdispVal, &pfinfo[i]);
													teExecMethod(pList, L"push", NULL, -1, &v);
													VariantClear(&v);
												}
											}
										}
									} catch (...) {}
									LocalUnlock(hInfo);
								}
								LocalFree(hInfo);
							}
							pdisp->Release();
						}
						pList->Release();
					}
					if (bDelete) {
						teSysFreeString(&lpszArcPath);
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (GetArchiveInfoW || GetArchiveInfo) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			case 0x60010007://GetFileInfo
				if (nArg >= 4) {
					BOOL bDelete = FALSE;
					LONG_PTR len = GetPtrFromVariant(&pDispParams->rgvarg[nArg - 1]);
					BSTR lpBuf = GetMemoryFromVariant(&pDispParams->rgvarg[nArg], &bDelete, &len);
					BSTR lpfilename = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 2]);
					int flag = GetIntFromVariant(&pDispParams->rgvarg[nArg - 3]);

					IUnknown *punk;
					if (FindUnknown(&pDispParams->rgvarg[nArg - 4], &punk)) {
						SUSIE_FINFOTW finfoW;
						SUSIE_FINFO finfo;
						BOOL bUnicode;
						BSTRA bsPathA = NULL;
						BSTRA bsItemA = NULL;
						iResult = GetFileInfoX(lpBuf, lpfilename, bDelete, &bsPathA, &bsItemA, NULL, len, flag, &finfoW, &finfo, &bUnicode);
						if (iResult == SPI_ALL_RIGHT) {
							if (bUnicode) {
								teSetSusieFileInfoW(punk, &finfoW);
							} else {
								teSetSusieFileInfoA(punk, &finfo);
							}
						}
						teSysFreeStringA(&bsPathA);
						teSysFreeStringA(&bsItemA);
					}
					if (bDelete) {
						teSysFreeString(&lpBuf);
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (GetFileInfoW || GetFileInfo) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			case 0x60010008://GetFile
				if (nArg >= 5) {
					BOOL bDelete = FALSE;
					LONG_PTR len = GetPtrFromVariant(&pDispParams->rgvarg[nArg - 1]);
					BSTR lpBuf = GetMemoryFromVariant(&pDispParams->rgvarg[nArg], &bDelete, &len);
					int flag = GetIntFromVariant(&pDispParams->rgvarg[nArg - 3]);
					HLOCAL hLocal = NULL;
					IUnknown *punk = NULL;
					FindUnknown(&pDispParams->rgvarg[nArg - 2], &punk);
					SafeRelease(&g_pdispProgressProc);
					GetDispatch(&pDispParams->rgvarg[nArg - 4], &g_pdispProgressProc);
					LONG_PTR lData = GetPtrFromVariant(&pDispParams->rgvarg[nArg - 5]);
					if (m_bIsUnicode && GetFileW) {
						GetFileW(lpBuf, len, (LPWSTR)&hLocal, flag | 0x100, tspi_ProgressCallback, lData);
					} else if (GetFile) {
						if (bDelete) {
							iResult = GetFile((LPSTR)lpBuf, len, (LPSTR)&hLocal, flag | 0x100, tspi_ProgressCallback, lData);
						} else {
							LPSTR bsBufA = teWide2Ansi(lpBuf, -1);
							iResult = GetFile(bsBufA, len, (LPSTR)&hLocal, flag | 0x100, tspi_ProgressCallback, lData);
							teSysFreeStringA(&bsBufA);
						}
					}
					if (bDelete) {
						teSysFreeString(&lpBuf);
					}
					if (hLocal) {
						UINT lSize = LocalSize(hLocal);
						PBYTE lpData = (PBYTE)LocalLock(hLocal);
						if (lpData) {
							IStream *pStream = NULL;
							if (punk) {
								pStream = SHCreateMemStream(lpData, lSize);
								if (pStream) {
									VARIANT v;
									VariantInit(&v);
									teSetObjectRelease(&v, pStream);
									tePutProperty(punk, L"0", &v);
									VariantClear(&v);
								}
							} else if SUCCEEDED(SHCreateStreamOnFileEx(GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 2]),
								STGM_WRITE | STGM_CREATE | STGM_SHARE_DENY_WRITE, FILE_ATTRIBUTE_NORMAL, TRUE, NULL, &pStream)) {
								pStream->Write(lpData, lSize, NULL);
								pStream->Release();
							}
							LocalUnlock(hLocal);
						}
						LocalFree(hLocal);
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (GetFileInfoW || GetFileInfo) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			case 0x60010009://ConfigurationDlg
				if (nArg >= 1) {
					if (ConfigurationDlg) {
						ConfigurationDlg((HWND)GetPtrFromVariant(&pDispParams->rgvarg[nArg]), GetIntFromVariant(&pDispParams->rgvarg[nArg - 1]));
					}
					teSetLong(pVarResult, iResult);
				} else if (wFlags == DISPATCH_PROPERTYGET) {
					if (ConfigurationDlg) {
						teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
					}
				}
				return S_OK;
			case 0x6001F000://Filter
				if (nArg >= 0) {
					teSysFreeString(&m_bsFilter);
					m_bsFilter = ::SysAllocString(GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]));
				}
				teSetSZ(pVarResult, m_bsFilter);
				return S_OK;
			case 0x6001F001://Preview
				if (nArg >= 0) {
					teSysFreeString(&m_bsPreview);
					m_bsPreview = ::SysAllocString(GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]));
				}
				teSetSZ(pVarResult, m_bsPreview);
				return S_OK;
			case 0x6001F002://Sync
				if (nArg >= 0) {
					m_bSync = GetIntFromVariant(&pDispParams->rgvarg[nArg]);
					if (m_bSync && !g_bUseGIT) {
						g_bUseGIT = TRUE;
						IGlobalInterfaceTable *pGlobalInterfaceTable;
						CoCreateInstance(CLSID_StdGlobalInterfaceTable, NULL, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pGlobalInterfaceTable));
						pGlobalInterfaceTable->RegisterInterfaceInGlobal(g_pBase, IID_IDispatch, &g_dwCookie);
						pGlobalInterfaceTable->Release();
					}
				}
				teSetBool(pVarResult, m_bSync);
				return S_OK;
			case 0x6001F003://Content
				if (nArg >= 0) {
					m_bIsPreview = GetIntFromVariant(&pDispParams->rgvarg[nArg]);
				}
				teSetBool(pVarResult, m_bIsPreview);
				return S_OK;
			case 0x6001FFFF://IsUnicode
				if (nArg >= 0) {
					m_bIsUnicode = GetIntFromVariant(&pDispParams->rgvarg[nArg]);
				}
				teSetBool(pVarResult, IsSupportedW && m_bIsUnicode);
				return S_OK;
			case DISPID_VALUE://this
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
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;
	HRESULT hr = S_OK;
	if (wFlags == DISPATCH_PROPERTYGET && dispIdMember >= TE_METHOD) {
		teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
		return S_OK;
	}

	switch (dispIdMember) {
		case 0x60010000://Open
			if (nArg >= 0) {
				LPWSTR lpLib = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);

				CteSPI *pItem;
				for (size_t i = g_ppObject.size(); i--;) {
					pItem = g_ppObject[i];
					if (lstrcmpi(lpLib, pItem->m_bsLib) == 0) {
						teSetObject(pVarResult, pItem);
						return S_OK;
					}
				}
				HMODULE hDll = LoadLibrary(lpLib);
				if (hDll) {
					pItem = new CteSPI(hDll, lpLib);
					g_ppObject.push_back(pItem);
					teSetObject(pVarResult, pItem);
				}
			}
			return S_OK;
		case 0x60010001://Clear
			for (size_t i = g_ppObject.size(); i--;) {
				SafeRelease(&g_ppObject[i]);
			}
			g_ppObject.clear();
			return S_OK;
		case 0x6001000C://Close
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
		case 0x4001F010://GetImage
			teSetPtr(pVarResult, GetImage);
			return S_OK;
		case 0x4001F011://GetArchve
			teSetPtr(pVarResult, GetArchive);
			return S_OK;
		case 0x6001F012://SetGetImage
			if (nArg >= 0) {
				lpfnGetImage = (LPFNGetImage)GetPtrFromVariant(&pDispParams->rgvarg[nArg]);
			}
			return S_OK;
		case 0x6001F020://Callback
			if (nArg >= 2) {
				HRESULT hr = E_NOTIMPL;
				int nMode = GetIntFromVariant(&pDispParams->rgvarg[nArg]);
				size_t i = GetPtrFromVariant(&pDispParams->rgvarg[nArg - 1]);
				LONG_PTR pArg = GetPtrFromVariant(&pDispParams->rgvarg[nArg - 2]);
				if (nMode) {
					hr = g_ppObject[i]->GetImage((TEGetImageArg *)pArg);
				} else {
					hr = g_ppObject[i]->GetArchive((TEGetArchiveArg *)pArg);
				}
				teSetLong(pVarResult, hr);
			}
			return S_OK;
		case DISPID_VALUE://this
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
