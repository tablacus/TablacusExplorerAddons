// Tablacus Common Archivers Library Wrapper (C)2015 Gaku
// MIT Lisence
// Visual Studio Express 2017 for Windows Desktop
// 32-bit Visual Studio 2015 - Windows XP (v140_xp)
// 64-bit Visual Studio 2017 (v141)
// https://tablacus.github.io/

#include "tcal.h"

// Global Variables:
const TCHAR g_szProgid[] = TEXT("Tablacus.CommonArchiversLibrary");
const TCHAR g_szClsid[] = TEXT("{D45DF22D-DA6A-406b-8C1E-5A6642B5BEE3}");
HINSTANCE g_hinstDll = NULL;
LONG      g_lLocks = 0;
CteBase		*g_pBase = NULL;
std::vector <CteCAL *> g_ppCAL;
LPFNGetImage lpfnGetImage = NULL;
HWND		g_hwnd = NULL;

std::unordered_map<std::wstring, DISPID> g_umBASE = {
	{ L"Open", 0x60010000 },
	{ L"Close", 0x6001000C },
	{ L"GetImage", 0x6001F010 },
	{ L"GetArchive", 0x6001F011 },
	{ L"hwnd", 0x6001F020 },
};

std::unordered_map<std::wstring, DISPID> g_umCAL = {
	{ L"Exec", 0x60010001 },
	{ L"GetVersion", 0x60010002 },
	{ L"GetRunning", 0x60010010 },
	{ L"CheckArchive", 0x60010011 },
	{ L"ConfigDialog", 0x60010012 },
	{ L"OpenArchive", 0x60010021 },
	{ L"CloseArchive", 0x60010022 },
	{ L"FindFirst", 0x60010023 },
	{ L"FindNext", 0x60010024 },
	{ L"ExtractMem", 0x60010025 },
	{ L"Close", 0x6001000C },
	{ L"Name", 0x6001F000 },
	{ L"Extract", 0x6001F001 },
	{ L"Add", 0x6001F002 },
	{ L"Delete", 0x6001F003 },
	{ L"Filter", 0x6001F004 },
	{ L"Content", 0x6001F005 },
	{ L"ContentFilter", 0x6001F006 },
	{ L"IsContent", 0x6001F100 },
	{ L"IsUnicode", 0x6001FFFF },
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

VOID teGetProcAddress(HMODULE hModule, LPWSTR lpHeadW, LPSTR lpName, FARPROC *lpfnA, FARPROC *lpfnW)
{
	char pszProcName[80];
	WideCharToMultiByte(CP_ACP, 0, (LPCWSTR)lpHeadW, -1, pszProcName, 80, NULL, NULL);
	strcat_s(pszProcName, 80, lpName);
	*lpfnA = GetProcAddress(hModule, (LPCSTR)pszProcName);
	if (lpfnW) {
		strcat_s(pszProcName, 80, "W");
		*lpfnW = GetProcAddress(hModule, (LPCSTR)pszProcName);
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

BSTR GetLPWSTRFromVariant(VARIANT *pv)
{
	if (pv->vt == (VT_VARIANT | VT_BYREF)) {
		return GetLPWSTRFromVariant(pv->pvarVal);
	}
	switch (pv->vt) {
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
					punk->Release();
					return true;
				}
				if SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(&pv->punkVal))) {
					pv->vt = VT_UNKNOWN;
					punk->Release();
					return true;
				}
			}
			punk->Release();
		} catch (...) {}
	}
	return false;
}

BSTRA teWide2Ansi(LPCWSTR lpW, int nCP)
{
	int nLenA = WideCharToMultiByte(nCP, 0, (LPCWSTR)lpW, -1, NULL, 0, NULL, NULL);
	BSTRA bsA = (BSTRA)::SysAllocStringByteLen(NULL, nLenA);
	if (nLenA) {
		WideCharToMultiByte(nCP, 0, lpW, -1, bsA, nLenA, NULL, NULL);
	}
	return bsA;
}

BSTR teAnsi2Wide(LPCSTR lpA, int nCP)
{
	int nLenW = MultiByteToWideChar(nCP, 0, lpA, -1, NULL, NULL);
	if (nLenW) {
		BSTR bs = ::SysAllocStringLen(NULL, nLenW);
		MultiByteToWideChar(nCP, 0, lpA, -1, bs, nLenW);
		return bs;
	}
	return NULL;
}

VOID teSetSZA(VARIANT *pv, LPCSTR lpstrA, int nCP)
{
	if (pv) {
		pv->bstrVal = teAnsi2Wide(lpstrA, nCP);
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
		pdex->Release();
	}
	return hr;
}

HRESULT tePutProperty(IUnknown *punk, LPOLESTR sz, VARIANT *pv)
{
	return tePutProperty0(punk, sz, pv, fdexNameEnsure);
}

VOID teSetPSZ(VARIANT *pv, LPCWSTR lpstr)
{
	if (lpstr) {
		IUnknown *punk = NULL;
		if (FindUnknown(pv, &punk)) {
			VARIANT v;
			teSetSZ(&v, lpstr);
			tePutProperty(punk, L"0", &v);
			VariantClear(&v);
		} else if (pv->vt == (VT_BYREF | VT_VARIANT)) {
			teSetSZ(pv->pvarVal, lpstr);
		}
	}
}

VOID teSetPSZA(VARIANT *pv, LPCSTR lpstrA, int nCP)
{
	if (lpstrA) {
		IUnknown *punk = NULL;
		if (FindUnknown(pv, &punk)) {
			VARIANT v;
			teSetSZA(&v, lpstrA, nCP);
			tePutProperty(punk, L"0", &v);
			VariantClear(&v);
		} else if (pv->vt == (VT_BYREF | VT_VARIANT)) {
			teSetSZA(pv->pvarVal, lpstrA, nCP);
		}
	}
}

VOID teVariantChangeType(__out VARIANTARG * pvargDest,
				__in const VARIANTARG * pvarSrc, __in VARTYPE vt)
{
	VariantInit(pvargDest);
	if FAILED(VariantChangeType(pvargDest, pvarSrc, 0, vt)) {
		pvargDest->llVal = 0;
	}
}

VOID teCALSetDW(IUnknown *punk, LPOLESTR lp, DWORD dw)
{
	VARIANT v;
	VariantInit(&v);
	teSetLong(&v, dw);
	tePutProperty(punk, lp, &v);
	VariantClear(&v);
}

VOID teCALSetSZ(IUnknown *punk, LPOLESTR lp, LPWSTR sz)
{
	VARIANT v;
	VariantInit(&v);
	teSetSZ(&v, sz);
	tePutProperty(punk, lp, &v);
	VariantClear(&v);
}

VOID teCALSetSZA(IUnknown *punk, LPOLESTR lp, LPCSTR szA, int nCP)
{
	VARIANT v;
	VariantInit(&v);
	teSetSZA(&v, szA, nCP);
	tePutProperty(punk, lp, &v);
	VariantClear(&v);
}

VOID GetCALInfoW(VARIANT *pv, INDIVIDUALINFOW info)
{
	IUnknown *punk;
	if (FindUnknown(pv, &punk)) {
		teCALSetDW(punk, L"dwOriginalSize", info.dwOriginalSize);
		teCALSetDW(punk, L"dwCompressedSize", info.dwCompressedSize);
		teCALSetDW(punk, L"dwCRC", info.dwCRC);
		teCALSetDW(punk, L"uFlag", info.uFlag);
		teCALSetDW(punk, L"uOSType", info.uOSType);
		teCALSetDW(punk, L"wRatio", info.wRatio);
		teCALSetDW(punk, L"wDate", info.wDate);
		teCALSetDW(punk, L"wTime", info.wTime);
		VARIANT v;
		v.vt = VT_DATE;
		::DosDateTimeToVariantTime(info.wDate, info.wTime, &v.date);
		tePutProperty(punk, L"DateTime", &v);
		teCALSetSZ(punk, L"szFileName", info.szFileName);
		teCALSetSZ(punk, L"szAttribute", info.szAttribute);
		teCALSetSZ(punk, L"szMode", info.szMode);
	}
}

VOID GetCALInfoA(VARIANT *pv, INDIVIDUALINFO info, int nCP)
{
	IUnknown *punk;
	if (FindUnknown(pv, &punk)) {
		teCALSetDW(punk, L"dwOriginalSize", info.dwOriginalSize);
		teCALSetDW(punk, L"dwCompressedSize", info.dwCompressedSize);
		teCALSetDW(punk, L"dwCRC", info.dwCRC);
		teCALSetDW(punk, L"uFlag", info.uFlag);
		teCALSetDW(punk, L"uOSType", info.uOSType);
		teCALSetDW(punk, L"wRatio", info.wRatio);
		teCALSetDW(punk, L"wDate", info.wDate);
		teCALSetDW(punk, L"wTime", info.wTime);
		VARIANT v;
		v.vt = VT_DATE;
		::DosDateTimeToVariantTime(info.wDate, info.wTime, &v.date);
		tePutProperty(punk, L"DateTime", &v);
		teCALSetSZA(punk, L"szFileName", info.szFileName, nCP);
		teCALSetSZA(punk, L"szAttribute", info.szAttribute, nCP);
		teCALSetSZA(punk, L"szMode", info.szMode, nCP);
	}
}


/*
BOOL GetDispatch(VARIANT *pv, IDispatch **ppdisp)
{
	IUnknown *punk;
	if (FindUnknown(pv, &punk)) {
		return SUCCEEDED(punk->QueryInterface(IID_PPV_ARGS(ppdisp)));
	}
	return false;
}
*/

// Initialize & Finalize
BOOL WINAPI DllMain(HINSTANCE hinstDll, DWORD dwReason, LPVOID lpReserved)
{
	switch (dwReason) {
		case DLL_PROCESS_ATTACH:
			g_pBase = new CteBase();
			g_hinstDll = hinstDll;
			break;
		case DLL_PROCESS_DETACH:
			for (size_t i = g_ppCAL.size(); i--;) {
				SafeRelease(&g_ppCAL[i]);
			}
			g_ppCAL.clear();
			SafeRelease(&g_pBase);
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

VOID teStrReplace(LPWSTR lpszData, LPWSTR lpszSrc, LPWSTR lpszDest, BOOL bQuote)
{
	LPWSTR lpszPos = lpszData;
	BSTR bsDest = lpszDest;
	if (bQuote) {
		bsDest = SysAllocStringLen(NULL, lstrlen(lpszDest) + 2);
		bsDest[0] = '"';
		lstrcpy(&bsDest[1], lpszDest);
		bsDest[lstrlen(lpszDest) + 1] = '"';
	}
	int nSrc = lstrlen(lpszSrc);
	while (lpszPos = StrChr(lpszPos, lpszSrc[0])) {
		if (lpszPos) {
			if (StrNCmpI(lpszPos, lpszSrc, nSrc) == 0) {
				BSTR bsNext = ::SysAllocString(&lpszPos[nSrc]);
				lstrcpy(lpszPos, bsDest);
				lstrcat(lpszPos, bsNext);
				::SysFreeString(bsNext);
				break;
			}
			lpszPos++;
		} else {
			break;
		}
	}
	if (bQuote) {
		teSysFreeString(&bsDest);
	}
}

//GetArchive
HRESULT WINAPI GetArchive(LPWSTR lpszArcPath, LPWSTR lpszItem, IStream **ppStream, LPVOID lpReserved)
{
	HRESULT hr = E_NOTIMPL;
	LockModule(TRUE);
	try {
		for (size_t i = 0; hr == E_NOTIMPL && i < g_ppCAL.size(); i++) {
			CteCAL *pCAL = g_ppCAL[i];
			if (PathMatchSpec(lpszItem, pCAL->m_pbs[CAL_PreviewFilter])) {
				hr = pCAL->ExtractToStream(lpszArcPath, lpszItem, ppStream);
			}
		}
	} catch (...) {}
	LockModule(FALSE);
	return hr;
}

//GetImage
HRESULT WINAPI GetImage(IStream *pStream, LPWSTR lpszPath, int cx, HBITMAP *phBM, int *pnAlpha)
{
	HRESULT hr = E_NOTIMPL;
	LockModule(TRUE);
	try {
		if (PathMatchSpec(lpszPath, L"?:\\*;\\\\*")) {
			BSTR bsItem = NULL;
			for (size_t i = 0; hr == E_NOTIMPL && i < g_ppCAL.size(); i++) {
				CteCAL *pCAL = g_ppCAL[i];
				if (lpfnGetImage && pCAL->m_bIsPreview) {
					IStream *pStreamOut = NULL;
					if SUCCEEDED(pCAL->ExtractToStream(lpszPath, bsItem, &pStreamOut)) {
						if (lpfnGetImage(pStreamOut, bsItem, cx, phBM, pnAlpha) == S_OK) {
							hr = S_OK;
						}
						pStreamOut->Release();
					}
				}
			}
		}
	} catch (...) {}
	LockModule(FALSE);
	return hr;
}

//CteCAL

CteCAL::CteCAL(HMODULE hDll, LPWSTR lpLib, LPWSTR lpHead)
{
	m_cRef = 1;
	for (int i = CAL_Count; i--;) {
		m_pbs[i] = NULL;
	}
	m_pbs[CAL_Lib] = ::SysAllocString(lpLib);
	m_pbs[CAL_Head] = ::SysAllocString(lpHead);
	Init(hDll);
}

CteCAL::~CteCAL()
{
	Free();
	for (int i = CAL_Count; i--;) {
		teSysFreeString(&m_pbs[i]);
	}
	for (size_t i = g_ppCAL.size(); i--;) {
		if (this == g_ppCAL[i]) {
			g_ppCAL.erase(g_ppCAL.begin() + i);
			break;
		}
	}
}

VOID CteCAL::Init(HMODULE hDLL)
{
	m_hCAL = hDLL;
	teGetProcAddress(m_hCAL, m_pbs[CAL_Head], "GetVersion", (FARPROC *)&CALGetVersion, NULL);
	teGetProcAddress(m_hCAL, m_pbs[CAL_Head], "GetRunning", (FARPROC *)&CALGetRunning, NULL);
	teGetProcAddress(m_hCAL, m_pbs[CAL_Head], "", (FARPROC *)&CAL, (FARPROC *)&CALW);
	teGetProcAddress(m_hCAL, m_pbs[CAL_Head], "CheckArchive", (FARPROC *)&CALCheckArchive, (FARPROC *)&CALCheckArchiveW);
	teGetProcAddress(m_hCAL, m_pbs[CAL_Head], "ConfigDialog", (FARPROC *)&CALConfigDialog, (FARPROC *)&CALConfigDialogW);
	teGetProcAddress(m_hCAL, m_pbs[CAL_Head], "OpenArchive", (FARPROC *)&CALOpenArchive, (FARPROC *)&CALOpenArchiveW);
	teGetProcAddress(m_hCAL, m_pbs[CAL_Head], "CloseArchive", (FARPROC *)&CALCloseArchive, NULL);
	teGetProcAddress(m_hCAL, m_pbs[CAL_Head], "FindFirst", (FARPROC *)&CALFindFirst, (FARPROC *)&CALFindFirstW);
	teGetProcAddress(m_hCAL, m_pbs[CAL_Head], "FindNext", (FARPROC *)&CALFindNext, (FARPROC *)&CALFindNextW);
	teGetProcAddress(m_hCAL, m_pbs[CAL_Head], "SetUnicodeMode", (FARPROC *)&CALSetUnicodeMode, NULL);
	teGetProcAddress(m_hCAL, m_pbs[CAL_Head], "ExtractMem", (FARPROC *)&CALExtractMem, (FARPROC *)&CALExtractMemW);
	m_CP = (CALSetUnicodeMode && CALSetUnicodeMode(TRUE)) ? CP_UTF8 : CP_ACP;
}

VOID CteCAL::Free()
{
	if (m_hCAL) {
		FreeLibrary(m_hCAL);
		m_hCAL = NULL;
	}
	m_CP = CP_ACP;
	CALGetVersion = NULL;
	CALGetRunning = NULL;
	CAL = NULL;
	CALW = NULL;
	CALCheckArchive = NULL;
	CALCheckArchiveW = NULL;
	CALConfigDialog = NULL;
	CALConfigDialogW = NULL;
	CALOpenArchive = NULL;
	CALOpenArchiveW = NULL;
	CALCloseArchive = NULL;
	CALFindFirst = NULL;
	CALFindFirstW = NULL;
	CALFindNext = NULL;
	CALFindNextW = NULL;
	CALSetUnicodeMode = NULL;
	CALExtractMem = NULL;
	CALExtractMemW = NULL;
}

HRESULT CteCAL::ExtractToStream(LPWSTR lpszArcPath, LPWSTR lpszFilter, IStream **ppStream)
{
	HRESULT hr = E_NOTIMPL;
	BSTR bsItem = NULL;
	DWORD dwSize = 0;
	if (!CALExtractMemW && !CALExtractMem) {
		return hr;
	}
	if (::SysStringLen(m_pbs[CAL_Preview]) == 0) {
		return hr;
	}
	if (!PathMatchSpec(lpszArcPath, m_pbs[CAL_Filter])) {
		return hr;
	}
	HARC harc = NULL;
	if (CALOpenArchiveW) {
		harc = CALOpenArchiveW(NULL, lpszArcPath, 0);
	} else if (CALCheckArchive) {
		BSTRA bsArcPathA = teWide2Ansi(lpszArcPath, m_CP);
		harc = CALOpenArchive(NULL, bsArcPathA, 0);
		teSysFreeStringA(&bsArcPathA);
	}
	if (harc) {
		if (CALFindFirstW) {
			INDIVIDUALINFOW infoW;
			int iFind = CALFindFirstW(harc, lpszFilter, &infoW);
			while (iFind == 0) {
				if (PathMatchSpec(infoW.szFileName, lpszFilter)) {
					dwSize = infoW.dwOriginalSize;
					bsItem = ::SysAllocString(infoW.szFileName);
					break;
				}
				iFind = CALFindNextW(harc, &infoW);
			}
		} else if (CALFindFirst) {
			BSTRA bsFilterA = teWide2Ansi(lpszFilter, m_CP);
			INDIVIDUALINFO info;
			int iFind = CALFindFirst(harc, bsFilterA, &info);
			while (iFind == 0) {
				if (PathMatchSpecA(info.szFileName, bsFilterA)) {
					dwSize = info.dwOriginalSize;
					bsItem = teAnsi2Wide(info.szFileName, m_CP);
					break;
				}
				iFind = CALFindNext(harc, &info);
			}
			teSysFreeStringA(&bsFilterA);
		}
		if (CALCloseArchive) {
			CALCloseArchive(harc);
		}
	}
	if (dwSize) {
		BSTR bsBuffer = ::SysAllocStringByteLen(NULL, dwSize);
		if (bsBuffer) {
			BSTR bsCmdLine = ::SysAllocStringLen(NULL, ::SysStringLen(m_pbs[CAL_Preview]) +
				lstrlen(lpszArcPath) + ::SysStringLen(bsItem));
			lstrcpy(bsCmdLine, m_pbs[CAL_Preview]);
			teStrReplace(bsCmdLine, L"%archive%", lpszArcPath, TRUE);
			teStrReplace(bsCmdLine, L"%items%", bsItem, TRUE);
			while (CALGetRunning && CALGetRunning()) {
				Sleep(100);
			}
			int iResult = -1;
			time_t Time;
			WORD wAttr;
			DWORD dwWriteSize;
			if (CALExtractMemW) {
				iResult = CALExtractMemW(g_hwnd, bsCmdLine, (LPBYTE)bsBuffer, dwSize, &Time, &wAttr, &dwWriteSize);
			} else if (CALExtractMem) {
				BSTRA bsCmdLineA = teWide2Ansi(bsCmdLine, m_CP);
				iResult = CALExtractMem(g_hwnd, bsCmdLineA, (LPBYTE)bsBuffer, dwSize, &Time, &wAttr, &dwWriteSize);
				teSysFreeStringA(&bsCmdLineA);
			}
			teSysFreeString(&bsCmdLine);
			if (iResult == 0) {
				*ppStream = SHCreateMemStream((LPBYTE)bsBuffer, dwSize);
				hr = *ppStream ? S_OK : E_OUTOFMEMORY;
			}
			teSysFreeString(&bsBuffer);
		}
	}
	teSysFreeString(&bsItem);
	return hr;
}

STDMETHODIMP CteCAL::QueryInterface(REFIID riid, void **ppvObject)
{
	static const QITAB qit[] =
	{
		QITABENT(CteCAL, IDispatch),
		{ 0 },
	};
	return QISearch(this, qit, riid, ppvObject);
}

STDMETHODIMP_(ULONG) CteCAL::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteCAL::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}
	return m_cRef;
}

STDMETHODIMP CteCAL::GetTypeInfoCount(UINT *pctinfo)
{
	*pctinfo = 0;
	return S_OK;
}

STDMETHODIMP CteCAL::GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo)
{
	return E_NOTIMPL;
}

STDMETHODIMP CteCAL::GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId)
{
	auto itr = g_umCAL.find(*rgszNames);
	if (itr != g_umCAL.end()) {
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

STDMETHODIMP CteCAL::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;
	HRESULT hr = S_OK;

	switch (dispIdMember) {
		case 0x60010001: //Exec
			if (nArg >= 1) {
				Free();
				Init(LoadLibrary(m_pbs[CAL_Lib]));
				HWND hwnd = (HWND)GetPtrFromVariant(&pDispParams->rgvarg[nArg]);
				LPWSTR lpCmdLine = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);
				DWORD dwSize = nArg >= 3 ? GetIntFromVariant(&pDispParams->rgvarg[nArg - 3]) : 0;
				if (CALW) {
					BSTR bsOutput = dwSize ? ::SysAllocStringLen(NULL, dwSize) : NULL;
					teSetLong(pVarResult, CALW(hwnd, lpCmdLine, bsOutput, dwSize));
					teSetPSZ(&pDispParams->rgvarg[nArg - 2], bsOutput);
					::SysFreeString(bsOutput);
				} else if (CAL) {
					BSTRA bsOutputA = dwSize ? (BSTRA)::SysAllocStringByteLen(NULL, dwSize * 2) : NULL;
					BSTRA bsCmdLineA = teWide2Ansi(lpCmdLine, m_CP);
					teSetLong(pVarResult, CAL(hwnd, bsCmdLineA, (LPSTR)bsOutputA, dwSize * 2));
					teSysFreeStringA(&bsCmdLineA);
					teSetPSZA(&pDispParams->rgvarg[nArg - 2], bsOutputA, m_CP);
					teSysFreeStringA(&bsOutputA);
				}
			} else if (wFlags == DISPATCH_PROPERTYGET) {
				if (CALW || CAL) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
			}
			return S_OK;		

		case 0x60010002://GetVersion
			if (wFlags == DISPATCH_PROPERTYGET) {
				if (CALGetVersion) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
				return S_OK;		
			}
			if (CALGetVersion) {
				teSetLong(pVarResult, CALGetVersion());
			}
			return S_OK;		

		case 0x60010010://GetRunning
			if (wFlags == DISPATCH_PROPERTYGET) {
				if (CALGetRunning) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
				return S_OK;		
			}
			if (CALGetRunning) {
				teSetBool(pVarResult, CALGetRunning());
			}
			return S_OK;		

		case 0x60010011://CheckArchive
			if (nArg >= 1) {
				LPWSTR lpFileName = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
				int iMode = nArg >= 1 ? GetIntFromVariant(&pDispParams->rgvarg[nArg - 1]) : 1;
				if (CALCheckArchiveW) {
					teSetBool(pVarResult, CALCheckArchiveW(lpFileName, iMode));
				} else if (CALCheckArchive) {
					BSTRA bsFileNameA = teWide2Ansi(lpFileName, m_CP);
					teSetBool(pVarResult, CALCheckArchive(bsFileNameA, iMode));
					teSysFreeStringA(&bsFileNameA);
				}
			} else if (wFlags == DISPATCH_PROPERTYGET) {
				if (CALCheckArchiveW || CALCheckArchive) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
			}
			return S_OK;		

		case 0x60010012://ConfigDialog
			if (nArg >= 1) {
				HWND hwnd = (HWND)GetPtrFromVariant(&pDispParams->rgvarg[nArg]);
				WCHAR szOptionBuffer[1024];
				int iMode = nArg >= 2 ? GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]) : 1;
				if (CALConfigDialogW) {
					teSetBool(pVarResult, CALConfigDialogW(hwnd, szOptionBuffer, iMode));
					teSetPSZ(&pDispParams->rgvarg[nArg - 1], szOptionBuffer);
				} else if (CALConfigDialog) {
					teSetBool(pVarResult, CALConfigDialog(hwnd, (LPSTR)szOptionBuffer, iMode));
					teSetPSZA(&pDispParams->rgvarg[nArg - 1], (LPCSTR)szOptionBuffer, m_CP);
				}
			} else if (wFlags == DISPATCH_PROPERTYGET) {
				if (CALConfigDialogW || CALConfigDialog) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
			}
			return S_OK;		

		case 0x60010021://OpenArchive
			if (nArg >= 2) {
				HWND hwnd = (HWND)GetPtrFromVariant(&pDispParams->rgvarg[nArg]);
				LPWSTR lpFileName = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);
				DWORD dwMode = GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]);
				if (CALOpenArchiveW) {
					teSetPtr(pVarResult, CALOpenArchiveW(hwnd, lpFileName, dwMode));
				} else if (CALCheckArchive) {
					BSTRA bsFileNameA = teWide2Ansi(lpFileName, m_CP);
					teSetPtr(pVarResult, CALOpenArchive(hwnd, bsFileNameA, dwMode));
					teSysFreeStringA(&bsFileNameA);
				}
			} else if (wFlags == DISPATCH_PROPERTYGET) {
				if (CALOpenArchiveW || CALOpenArchive) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
			}
			return S_OK;

		case 0x60010022://CloseArchive
			if (nArg >= 0) {
				if (CALCloseArchive) {
					teSetLong(pVarResult, CALCloseArchive((HARC)GetPtrFromVariant(&pDispParams->rgvarg[nArg])));
				}
			} else if (wFlags == DISPATCH_PROPERTYGET) {
				if (CALCloseArchive) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
			}
			return S_OK;		

		case 0x60010023://FindFirst
			if (nArg >= 2) {
				HARC hwnd = (HARC)GetPtrFromVariant(&pDispParams->rgvarg[nArg]);
				LPWSTR lpWildName = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);
				if (CALFindFirstW) {
					INDIVIDUALINFOW infoW;
					teSetLong(pVarResult, CALFindFirstW(hwnd, lpWildName, &infoW));
					GetCALInfoW(&pDispParams->rgvarg[nArg - 2], infoW);
				} else if (CALFindFirst) {
					INDIVIDUALINFO info;
					BSTRA bsWildNameA = teWide2Ansi(lpWildName, m_CP);
					teSetLong(pVarResult, CALFindFirst(hwnd, bsWildNameA, &info));
					GetCALInfoA(&pDispParams->rgvarg[nArg - 2], info, m_CP);
					teSysFreeStringA(&bsWildNameA);
				}
			} else if (wFlags == DISPATCH_PROPERTYGET) {
				if (CALFindFirstW || CALFindFirst) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
			}
			return S_OK;

		case 0x60010024://FindNext
			if (nArg >= 1) {
				HARC hwnd = (HARC)GetPtrFromVariant(&pDispParams->rgvarg[nArg]);
				if (CALFindNextW) {
					INDIVIDUALINFOW infoW;
					teSetLong(pVarResult, CALFindNextW(hwnd, &infoW));
					GetCALInfoW(&pDispParams->rgvarg[nArg - 1], infoW);
				} else if (CALFindNext) {
					INDIVIDUALINFO info;
					teSetLong(pVarResult, CALFindNext(hwnd, &info));
					GetCALInfoA(&pDispParams->rgvarg[nArg - 1], info, m_CP);
				}
			} else if (wFlags == DISPATCH_PROPERTYGET) {
				if (CALFindNextW || CALFindNext) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
			}
			return S_OK;

		case 0x60010025://ExtractMem
			if (wFlags == DISPATCH_PROPERTYGET) {
				if (CALExtractMemW || CALExtractMem) {
					teSetObjectRelease(pVarResult, new CteDispatch(this, 0, dispIdMember));
				}
			}
			return S_OK;

		case 0x6001000C://Close
			CteCAL *pItem;
			for (size_t i = g_ppCAL.size(); i--;) {
				pItem = g_ppCAL[i];
				if (this == pItem) {
					SafeRelease(&g_ppCAL[i]);
					break;
				}
			}
			return S_OK;

		case 0x6001F000://Name
		case 0x6001F001://Extract
		case 0x6001F002://Add
		case 0x6001F003://Delete
		case 0x6001F004://Filter
		case 0x6001F005://Preview
		case 0x6001F006://PreviewFilter
			if (nArg >= 0) {
				teSysFreeString(&m_pbs[dispIdMember - 0x6001F000 + CAL_Name]);
				m_pbs[dispIdMember - 0x6001F000 + CAL_Name] = ::SysAllocString(GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]));
			}
			teSetSZ(pVarResult, m_pbs[dispIdMember - 0x6001F000 + CAL_Name]);
			return S_OK;

		case 0x6001F100://IsPreview
			if (nArg >= 0) {
				m_bIsPreview = GetIntFromVariant(&pDispParams->rgvarg[nArg]);
			}
			teSetBool(pVarResult, m_bIsPreview);
			return S_OK;

		case 0x6001FFFF://IsUnicode
			teSetBool(pVarResult, m_CP == CP_UTF8 || CALW);
			return S_OK;
		
		case DISPID_VALUE://this
			if (pVarResult) {
				teSetObject(pVarResult, this);
			}
			return S_OK;
	}//end_switch
/*/// for Debug
	TCHAR szError[16];
	wsprintf(szError, TEXT("%x"), dispIdMember);
	MessageBox(NULL, (LPWSTR)szError, 0, 0);
*///
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
	auto itr = g_umBASE.find(*rgszNames);
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
			if (nArg >= 1) {
				LPWSTR lpLib = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
				LPWSTR lpHead = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);

				CteCAL *pItem;
				for (size_t i = g_ppCAL.size(); i--;) {
					pItem = g_ppCAL[i];
					if (pItem) {
						if (lstrcmpi(lpLib, pItem->m_pbs[CAL_Lib]) == 0 && lstrcmpi(lpHead, pItem->m_pbs[CAL_Head]) == 0) {
							teSetObject(pVarResult, pItem);
							return S_OK;
						}
					}
				}
				HMODULE hDll = LoadLibrary(lpLib);
				if (hDll) {
					pItem = new CteCAL(hDll, lpLib, lpHead);
					g_ppCAL.push_back(pItem);
					teSetObjectRelease(pVarResult, pItem);
				}
			}
			return S_OK;

		case 0x6001000C://Close
			if (nArg >= 1) {
				LPWSTR lpLib = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
				LPWSTR lpHead = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);

				for (size_t i = g_ppCAL.size(); i--;) {
					CteCAL *pItem = g_ppCAL[i];
					if (lstrcmpi(lpLib, pItem->m_pbs[CAL_Lib]) == 0 && lstrcmpi(lpHead, pItem->m_pbs[CAL_Head]) == 0) {
						SafeRelease(&g_ppCAL[i]);
						break;
					}
				}
			}
			return S_OK;

		case 0x6001F010://GetImage
			if (nArg >= 0) {
				lpfnGetImage = (LPFNGetImage)GetPtrFromVariant(&pDispParams->rgvarg[nArg]);
			}
			teSetPtr(pVarResult, GetImage);
			return S_OK;

		case 0x6001F011://GetArchive
			teSetPtr(pVarResult, GetArchive);
			return S_OK;

		case 0x6001F020://hwnd
			if (nArg >= 0) {
				g_hwnd = (HWND)GetPtrFromVariant(&pDispParams->rgvarg[nArg]);
			}
			teSetPtr(pVarResult, g_hwnd);
			return S_OK;

		case DISPID_VALUE://this
			teSetObject(pVarResult, this);
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
