// Tablacus C/Migemo Wrapper (C)2015 Gaku
// MIT Lisence
// Visual C++ 2008 Express Edition SP1
// Windows SDK v7.0
// http://www.eonet.ne.jp/~gakana/tablacus/

#include "tcmigemo.h"

// Global Variables:
CteMigemo *g_ppMigemo[MAX_MIGEMO];

// Unit
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

VOID teSetLong(VARIANT *pv, LONG i)
{
	if (pv) {
		pv->lVal = i;
		pv->vt = VT_I4;
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

VOID teVariantChangeType(__out VARIANTARG * pvargDest,
				__in const VARIANTARG * pvarSrc, __in VARTYPE vt)
{
	VariantInit(pvargDest);
	if FAILED(VariantChangeType(pvargDest, pvarSrc, 0, vt)) {
		pvargDest->llVal = 0;
	}
}

LPSTR teWideToAnsiPath(LPWSTR lpDictW, LPSTR pszDictA)
{
	LPSTR lpDictA = NULL;
	if (lpDictW) {
		lpDictA = pszDictA;
		WideCharToMultiByte(CP_ACP, 0, (LPCWSTR)lpDictW, -1, lpDictA, MAX_PATH, NULL, NULL);
		if (strchr(lpDictA, '?')) {
			WCHAR pszDictW[MAX_PATH];
			if (GetShortPathName(lpDictW, pszDictW, MAX_PATH)) {
				WideCharToMultiByte(CP_ACP, 0, (LPCWSTR)pszDictW, -1, lpDictA, MAX_PATH, NULL, NULL);
			}
		}
	}
	return lpDictA;
}

// Initialize & Finalize
BOOL WINAPI DllMain(HINSTANCE hinstDll, DWORD dwReason, LPVOID lpReserved)
{
	switch (dwReason) {
		case DLL_PROCESS_ATTACH:
			for (int i = MAX_MIGEMO; i--;) {
				g_ppMigemo[i] = NULL;
			}
			break;
		case DLL_PROCESS_DETACH:
			for (int i = MAX_MIGEMO; i--;) {
				if (g_ppMigemo[i]) {
					g_ppMigemo[i]->Close();
					g_ppMigemo[i]->Release();
				}
			}
			break;
	}
	return TRUE;
}

// DLL Export
STDAPI_(VOID) Migemo(VARIANT *pVarResult)
{
	CteMigemo *pMigemo = NULL;
	for (int i = MAX_MIGEMO; i--;) {
		if (!g_ppMigemo[i]) {
			pMigemo = new CteMigemo();
			g_ppMigemo[i] = pMigemo;
			break;
		}
		if (!g_ppMigemo[i]->m_hMigemo) {
			pMigemo = g_ppMigemo[i];
			break;
		}
	}
	teSetObjectRelease(pVarResult, pMigemo);
}

//CteMigemo

CteMigemo::CteMigemo()
{
	m_cRef = 1;
	m_CP = CP_UTF8;
	m_hMigemo = 0;
	m_pMigemo = NULL;
	migemo_open = NULL;
	migemo_close = NULL;
	migemo_query = NULL;
	migemo_release = NULL;
	migemo_load = NULL;
	migemo_is_enable = NULL;
}

CteMigemo::~CteMigemo()
{
	Close();
	for (int i = MAX_MIGEMO; i--;) {
		if (this == g_ppMigemo[i]) {
			g_ppMigemo[i] = NULL;
		}
	}
}

VOID CteMigemo::Close()
{
	if (m_pMigemo && migemo_close) {
		migemo_close(m_pMigemo);
		m_pMigemo = NULL;
		migemo_open = NULL;
		migemo_close = NULL;
		migemo_query = NULL;
		migemo_release = NULL;
		migemo_load = NULL;
		migemo_is_enable = NULL;
	}
	if (m_hMigemo) {
		FreeLibrary(m_hMigemo);
		m_hMigemo = NULL;
	}
	m_CP = CP_UTF8;
}

STDMETHODIMP CteMigemo::QueryInterface(REFIID riid, void **ppvObject)
{
	*ppvObject = NULL;

	if (IsEqualIID(riid, IID_IUnknown) || IsEqualIID(riid, IID_IDispatch)) {
		*ppvObject = static_cast<IDispatch *>(this);
	} else {
		return E_NOINTERFACE;
	}
	AddRef();
	return S_OK;
}

STDMETHODIMP_(ULONG) CteMigemo::AddRef()
{
	return ::InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) CteMigemo::Release()
{
	if (::InterlockedDecrement(&m_cRef) == 0) {
		delete this;
		return 0;
	}
	return m_cRef;
}

STDMETHODIMP CteMigemo::GetTypeInfoCount(UINT *pctinfo)
{
	*pctinfo = 0;
	return S_OK;
}

STDMETHODIMP CteMigemo::GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo)
{
	return E_NOTIMPL;
}

STDMETHODIMP CteMigemo::GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId)
{
	if (lstrcmpi(*rgszNames, L"open") == 0) {
		*rgDispId = 0x60010001;
		return S_OK;
	}
	if (lstrcmpi(*rgszNames, L"close") == 0) {
		*rgDispId = 0x60010002;
		return S_OK;
	}
	if (lstrcmpi(*rgszNames, L"query") == 0) {
		*rgDispId = 0x60010003;
		return S_OK;
	}
	if (lstrcmpi(*rgszNames, L"load") == 0) {
		*rgDispId = 0x60010005;
		return S_OK;
	}
	if (lstrcmpi(*rgszNames, L"is_enable") == 0) {
		*rgDispId = 0x60010006;
		return S_OK;
	}
	return DISP_E_UNKNOWNNAME;
}

STDMETHODIMP CteMigemo::Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr)
{
	int nArg = pDispParams ? pDispParams->cArgs - 1 : -1;
	HRESULT hr = S_OK;

	switch (dispIdMember) {
		//open
		case 0x60010001:
			if (nArg >= 0) {
				if (m_hMigemo) {
					Close();
				}
				m_hMigemo = LoadLibrary(GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg]));
				if (m_hMigemo) {
					migemo_open = (LPFNmigemo_open)GetProcAddress(m_hMigemo, "migemo_open");
					migemo_close = (LPFNmigemo_close)GetProcAddress(m_hMigemo, "migemo_close");
					migemo_query = (LPFNmigemo_query)GetProcAddress(m_hMigemo, "migemo_query");
					migemo_release = (LPFNmigemo_release)GetProcAddress(m_hMigemo, "migemo_release");
					migemo_load = (LPFNmigemo_load)GetProcAddress(m_hMigemo, "migemo_load");
					migemo_is_enable = (LPFNmigemo_is_enable)GetProcAddress(m_hMigemo, "migemo_is_enable");
					if (migemo_open && migemo_close) {
						LPSTR lpDictA = NULL;
						CHAR pszDictA[MAX_PATH];
						if (nArg >= 1) {
							lpDictA = teWideToAnsiPath(GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]), pszDictA);
							if (nArg >= 2) {
								m_CP = GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]);
							}
						}
						m_pMigemo = migemo_open(lpDictA);
						if (migemo_is_enable && m_pMigemo) {
							teSetLong(pVarResult, migemo_is_enable(m_pMigemo));
						}
					}
				}
			}
			return S_OK;
		//close
		case 0x60010002:
			Close();
			return S_OK;
		//query
		case 0x60010003:
			if (migemo_query && m_pMigemo && nArg >= 0 && pVarResult) {
				VARIANT v;
				teVariantChangeType(&v, &pDispParams->rgvarg[nArg], VT_BSTR);
				int nLenW = ::SysStringLen(v.bstrVal) + 1;
				int nLenA = WideCharToMultiByte(m_CP, 0, v.bstrVal, nLenW, NULL, 0, NULL, NULL);
				const unsigned char *pszQueryA = new unsigned char[nLenA];
				WideCharToMultiByte(m_CP, 0, v.bstrVal, nLenW, (LPSTR)pszQueryA, nLenA, NULL, NULL);
				unsigned char *pszREA = migemo_query(m_pMigemo, pszQueryA);
				delete [] pszQueryA;
				if (pszREA) {
					nLenW = MultiByteToWideChar(m_CP, 0, (LPSTR)pszREA, -1, NULL, NULL);
					pVarResult->bstrVal = SysAllocStringLen(NULL, nLenW - 1);
					MultiByteToWideChar(m_CP, 0, (LPSTR)pszREA, -1, pVarResult->bstrVal, nLenW);
					pVarResult->vt = VT_BSTR;
					migemo_release(m_pMigemo, pszREA);
				}
			}
			return S_OK;
		//load
		case 0x60010005:
			if (migemo_load && m_pMigemo && nArg >= 1) {
				CHAR pszDictA[MAX_PATH];
				LPSTR lpDictA = teWideToAnsiPath(GetLPWSTRFromVariant(&pDispParams->rgvarg[nArg - 1]), pszDictA);
				if (nArg >= 2) {
					m_CP = GetIntFromVariant(&pDispParams->rgvarg[nArg - 2]);
				}
				teSetLong(pVarResult, migemo_load(m_pMigemo, GetIntFromVariant(&pDispParams->rgvarg[nArg]), lpDictA));
			}
			return S_OK;
		//is_enable
		case 0x60010006:
			if (migemo_is_enable && m_pMigemo) {
				teSetLong(pVarResult, migemo_is_enable(m_pMigemo));
			}
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
	swprintf_s(szError, 16, TEXT("%x"), dispIdMember);
	MessageBox(NULL, (LPWSTR)szError, 0, 0);
*///
	return DISP_E_MEMBERNOTFOUND;
}
