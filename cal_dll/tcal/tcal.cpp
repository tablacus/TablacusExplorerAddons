// Tablacus Common Archivers Library Wrapper (C)2015 Gaku
// MIT Lisence
// Visual C++ 2008 Express Edition SP1
// Windows SDK v7.0
// http://www.eonet.ne.jp/~gakana/tablacus/

#include "tcal.h"

// Global Variables:
const TCHAR g_szProgid[] = TEXT("Tablacus.CommonArchiversLibrary");
const TCHAR g_szClsid[] = TEXT("{D45DF22D-DA6A-406b-8C1E-5A6642B5BEE3}");
HINSTANCE g_hinstDll = NULL;
LONG      g_lLocks = 0;
CteBase		*g_pBase = NULL;
CteCAL *g_ppCAL[MAX_CAL];

TEmethod methodBASE[] = {
	{ 0x60010000, L"Open" },
	{ 0x6001000C, L"Close" },
};

TEmethod methodTCAL[] = {
	{ 0x60010001, L"Exec" },
	{ 0x60010002, L"GetVersion" },
	{ 0x60010010, L"GetRunning" },
	{ 0x60010011, L"CheckArchive" },
	{ 0x60010012, L"ConfigDialog" },
	{ 0x60010021, L"OpenArchive" },
	{ 0x60010022, L"CloseArchive" },
	{ 0x60010023, L"FindFirst" },
	{ 0x60010024, L"FindNext" },
	{ 0x6001000C, L"Close" },
	{ 0x6001FFFF, L"IsUnicode" },
	{ 0, NULL }
};

// Unit
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

VOID teSetSZA(VARIANT *pv, LPCWSTR lpstr, int nCP)
{
	if (pv) {
		int nLenW = MultiByteToWideChar(nCP, 0, (LPCSTR)lpstr, -1, NULL, NULL);
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

VOID teSetPSZA(VARIANT *pv, LPCWSTR lpstr, int nCP)
{
	if (lpstr) {
		IUnknown *punk = NULL;
		if (FindUnknown(pv, &punk)) {
			VARIANT v;
			teSetSZA(&v, lpstr, nCP);
			tePutProperty(punk, L"0", &v);
			VariantClear(&v);
		} else if (pv->vt == (VT_BYREF | VT_VARIANT)) {
			teSetSZA(pv->pvarVal, lpstr, nCP);
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

BSTR teWide2Ansi(LPWSTR lpW, int nCP)
{
	int nLenA = WideCharToMultiByte(nCP, 0, (LPCWSTR)lpW, -1, NULL, 0, NULL, NULL);
	BSTR bs = ::SysAllocStringByteLen(NULL, nLenA);
	WideCharToMultiByte(nCP, 0, (LPCWSTR)lpW, -1, (LPSTR)bs, nLenA, NULL, NULL);
	LPSTR lp = (LPSTR)bs;
	return bs;
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

VOID teCALSetSZA(IUnknown *punk, LPOLESTR lp, LPCSTR sz, int nCP)
{
	VARIANT v;
	VariantInit(&v);
	teSetSZA(&v, (LPCWSTR)sz, nCP);
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
			for (int i = MAX_CAL; i--;) {
				g_ppCAL[i] = NULL;
			}
			g_pBase = new CteBase();
			g_hinstDll = hinstDll;
			break;
		case DLL_PROCESS_DETACH:
			for (int i = MAX_CAL; i--;) {
				if (g_ppCAL[i]) {
					g_ppCAL[i]->Close();
					g_ppCAL[i]->Release();
				}
			}
			g_pBase->Release();
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

//CteCAL

CteCAL::CteCAL(HMODULE hDll, LPWSTR lpLib, LPWSTR lpHead)
{
	m_cRef = 1;
	m_hCAL = hDll;
	m_bsLib = ::SysAllocString(lpLib);
	m_bsHead = ::SysAllocString(lpHead);

	teGetProcAddress(m_hCAL, lpHead, "GetVersion", (FARPROC *)&CALGetVersion, NULL);
	teGetProcAddress(m_hCAL, lpHead, "GetRunning", (FARPROC *)&CALGetRunning, NULL);
	teGetProcAddress(m_hCAL, lpHead, "", (FARPROC *)&CAL, (FARPROC *)&CALW);
	teGetProcAddress(m_hCAL, lpHead, "CheckArchive", (FARPROC *)&CALCheckArchive, (FARPROC *)&CALCheckArchiveW);
	teGetProcAddress(m_hCAL, lpHead, "ConfigDialog", (FARPROC *)&CALConfigDialog, (FARPROC *)&CALConfigDialogW);
	teGetProcAddress(m_hCAL, lpHead, "OpenArchive", (FARPROC *)&CALOpenArchive, (FARPROC *)&CALOpenArchiveW);
	teGetProcAddress(m_hCAL, lpHead, "CloseArchive", (FARPROC *)&CALCloseArchive, NULL);
	teGetProcAddress(m_hCAL, lpHead, "FindFirst", (FARPROC *)&CALFindFirst, (FARPROC *)&CALFindFirstW);
	teGetProcAddress(m_hCAL, lpHead, "FindNext", (FARPROC *)&CALFindNext, (FARPROC *)&CALFindNextW);
	teGetProcAddress(m_hCAL, lpHead, "SetUnicodeMode", (FARPROC *)&CALSetUnicodeMode, NULL);
	m_CP = (CALSetUnicodeMode && CALSetUnicodeMode(TRUE)) ? CP_UTF8 : CP_ACP;
}

CteCAL::~CteCAL()
{
	Close();
	for (int i = MAX_CAL; i--;) {
		if (this == g_ppCAL[i]) {
			g_ppCAL[i] = NULL;
			break;
		}
	}
}

VOID CteCAL::Close()
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
	return teGetDispId(methodTCAL, _countof(methodTCAL), NULL, *rgszNames, rgDispId);
}

STDMETHODIMP CteCAL::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;
	HRESULT hr = S_OK;

	switch (dispIdMember) {
		//Exec
		case 0x60010001:
			if (nArg >= 1) {
				HWND hwnd = (HWND)GetLLFromVariant(&pDispParams->rgvarg[nArg]);
				LPWSTR lpCmdLine = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);
				DWORD dwSize = nArg >= 3 ? GetIntFromVariant(&pDispParams->rgvarg[nArg - 3]) : 0;
				if (CALW) {
					BSTR bsOutput = dwSize ? ::SysAllocStringLen(NULL, dwSize) : NULL;
					teSetLong(pVarResult, CALW(hwnd, lpCmdLine, bsOutput, dwSize));
					teSetPSZ(&pDispParams->rgvarg[nArg - 2], bsOutput);
					::SysFreeString(bsOutput);
				} else if (CAL) {
					BSTR bsOutput = dwSize ? ::SysAllocStringByteLen(NULL, dwSize) : NULL;
					BSTR bsCmdLine = teWide2Ansi(lpCmdLine, m_CP);
					teSetLong(pVarResult, CAL(hwnd, (LPCSTR)bsCmdLine, (LPSTR)bsOutput, dwSize));
					teSetPSZA(&pDispParams->rgvarg[nArg - 2], bsOutput, m_CP);
					teSysFreeString(&bsOutput);
					teSysFreeString(&bsCmdLine);
				}
			} else if (wFlags == DISPATCH_PROPERTYGET) {
				teSetBool(pVarResult, CALW || CAL);
			}
			return S_OK;		
		//GetVersion
		case 0x60010002:
			if (wFlags == DISPATCH_PROPERTYGET) {
				teSetBool(pVarResult, CALGetVersion != NULL);
				return S_OK;		
			}
			if (CALGetVersion) {
				teSetLong(pVarResult, CALGetVersion());
			}
			return S_OK;		
		//GetRunning
		case 0x60010010:
			if (wFlags == DISPATCH_PROPERTYGET) {
				teSetBool(pVarResult, CALGetRunning != NULL);
				return S_OK;		
			}
			if (CALGetRunning) {
				teSetBool(pVarResult, CALGetRunning());
			}
			return S_OK;		
		//CheckArchive
		case 0x60010011:
			if (nArg >= 1) {
				LPWSTR lpFileName = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
				int iMode = nArg >= 1 ? GetIntFromVariant(&pDispParams->rgvarg[nArg - 1]) : 1;
				if (CALCheckArchiveW) {
					teSetBool(pVarResult, CALCheckArchiveW(lpFileName, iMode));
				} else if (CALCheckArchive) {
					BSTR bsFileName = teWide2Ansi(lpFileName, m_CP);
					teSetBool(pVarResult, CALCheckArchive((LPCSTR)bsFileName, iMode));
					teSysFreeString(&bsFileName);
				}
			} else if (wFlags == DISPATCH_PROPERTYGET) {
				teSetBool(pVarResult, CALCheckArchiveW || CALCheckArchive);
			}
			return S_OK;		
		//ConfigDialog
		case 0x60010012:
			if (nArg >= 1) {
				HWND hwnd = (HWND)GetLLFromVariant(&pDispParams->rgvarg[nArg]);
				WCHAR szOptionBuffer[1024];
				int iMode = nArg >= 2 ? GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]) : 1;
				if (CALConfigDialogW) {
					teSetBool(pVarResult, CALConfigDialogW(hwnd, szOptionBuffer, iMode));
					teSetPSZ(&pDispParams->rgvarg[nArg - 1], szOptionBuffer);
				} else if (CALConfigDialog) {
					teSetBool(pVarResult, CALConfigDialog(hwnd, (LPSTR)szOptionBuffer, iMode));
					teSetPSZA(&pDispParams->rgvarg[nArg - 1], szOptionBuffer, m_CP);
				}
			} else if (wFlags == DISPATCH_PROPERTYGET) {
				teSetBool(pVarResult, CALConfigDialogW || CALConfigDialog);
			}
			return S_OK;		
		//OpenArchive
		case 0x60010021:
			if (nArg >= 2) {
				HWND hwnd = (HWND)GetLLFromVariant(&pDispParams->rgvarg[nArg]);
				LPWSTR lpFileName = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);
				DWORD dwMode = GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]);
				if (CALOpenArchiveW) {
					teSetLL(pVarResult, (LONGLONG)CALOpenArchiveW(hwnd, lpFileName, dwMode));
				} else if (CALCheckArchive) {
					BSTR bsFileName = teWide2Ansi(lpFileName, m_CP);
					teSetLL(pVarResult, (LONGLONG)CALOpenArchive(hwnd, (LPCSTR)bsFileName, dwMode));
					teSysFreeString(&bsFileName);
				}
			} else if (wFlags == DISPATCH_PROPERTYGET) {
				teSetBool(pVarResult, CALOpenArchiveW || CALOpenArchive);
			}
			return S_OK;
		//CloseArchive
		case 0x60010022:
			if (nArg >= 0) {
				if (CALCloseArchive) {
					teSetLong(pVarResult, CALCloseArchive((HARC)GetLLFromVariant(&pDispParams->rgvarg[nArg])));
				}
			} else if (wFlags == DISPATCH_PROPERTYGET) {
				teSetBool(pVarResult, CALCloseArchive != NULL);
			}
			return S_OK;		
		//FindFirst
		case 0x60010023:
			if (nArg >= 2) {
				HARC hwnd = (HARC)GetLLFromVariant(&pDispParams->rgvarg[nArg]);
				LPWSTR lpWildName = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);
				if (CALFindFirstW) {
					INDIVIDUALINFOW infoW;
					teSetLong(pVarResult, CALFindFirstW(hwnd, lpWildName, &infoW));
					GetCALInfoW(&pDispParams->rgvarg[nArg - 2], infoW);
				} else if (CALFindFirst) {
					INDIVIDUALINFO info;
					BSTR bsWildName = teWide2Ansi(lpWildName, m_CP);
					teSetLong(pVarResult, CALFindFirst(hwnd, (LPCSTR)bsWildName, &info));
					GetCALInfoA(&pDispParams->rgvarg[nArg - 2], info, m_CP);
					teSysFreeString(&bsWildName);
				}
			} else if (wFlags == DISPATCH_PROPERTYGET) {
				teSetBool(pVarResult, CALFindFirstW || CALFindFirst);
			}
			return S_OK;
		//FindNext
		case 0x60010024:
			if (nArg >= 1) {
				HARC hwnd = (HARC)GetLLFromVariant(&pDispParams->rgvarg[nArg]);
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
				teSetBool(pVarResult, CALFindNextW || CALFindNext);
			}
			return S_OK;
		//Close
		case 0x6001000C:
			CteCAL *pItem;
			for (int i = MAX_CAL; i--;) {
				pItem = g_ppCAL[i];
				if (this == pItem) {
					Close();
					Release();
					g_ppCAL[i] = NULL;
					break;
				}
			}
			return S_OK;
		//IsUnicode
		case 0x6001FFFF:
			teSetBool(pVarResult, CALOpenArchiveW || CALSetUnicodeMode);
			return S_OK;
		//this
		case DISPID_VALUE:
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
	return teGetDispId(methodBASE, _countof(methodBASE), NULL, *rgszNames, rgDispId);
}

STDMETHODIMP CteBase::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;
	HRESULT hr = S_OK;

	switch (dispIdMember) {
		//Open
		case 0x60010000:
			if (nArg >= 1) {
				LPWSTR lpLib = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
				LPWSTR lpHead = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);

				int nEmpty = -1;
				CteCAL *pItem;
				for (int i = MAX_CAL; i--;) {
					pItem = g_ppCAL[i];
					if (pItem) {
						if (lstrcmpi(lpLib, pItem->m_bsLib) == 0 && lstrcmpi(lpHead, pItem->m_bsHead) == 0) {
							teSetObject(pVarResult, pItem);
							return S_OK;
						}
					} else if (nEmpty < 0) {
						nEmpty = i;
					}
				}
				if (nEmpty >= 0) {
					HMODULE hDll = LoadLibrary(lpLib);
					if (hDll) {
						pItem = new CteCAL(hDll, lpLib, lpHead);
						g_ppCAL[nEmpty] = pItem;
						teSetObjectRelease(pVarResult, pItem);
					}
				}
			}
			return S_OK;
		//Close
		case 0x6001000C:
			if (nArg >= 1) {
				LPWSTR lpLib = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]);
				LPWSTR lpHead = GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]);

				CteCAL *pItem;
				for (int i = MAX_CAL; i--;) {
					pItem = g_ppCAL[i];
					if (pItem) {
						if (lstrcmpi(lpLib, pItem->m_bsLib) == 0 && lstrcmpi(lpHead, pItem->m_bsHead) == 0) {
							pItem->Close();
							pItem->Release();
							g_ppCAL[i] = NULL;
							break;
						}
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
