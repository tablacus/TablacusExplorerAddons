#include "resource.h"
#include <windows.h>
#include <dispex.h>
#include <shlwapi.h>
#include <shlobj.h>
#include <propkey.h>
#include <propvarutil.h>
#include <wchar.h>
#pragma comment (lib, "shlwapi.lib")

#define MAX_OBJ 256
#define SIZE_BUFF 32768

struct TEmethod
{
	LONG   id;
	LPWSTR name;
};

#ifdef _WIN64
#define teSetPtr(pVar, nData)	teSetLL(pVar, (LONGLONG)nData)
#define GetPtrFromVariant(pv)	GetLLFromVariant(pv)
#else
#define teSetPtr(pVar, nData)	teSetLong(pVar, (LONG)nData)
#define GetPtrFromVariant(pv)	GetIntFromVariant(pv)
#endif


// Base Object
class CteBase : public IDispatch
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();
	//IDispatch
	STDMETHODIMP GetTypeInfoCount(UINT *pctinfo);
	STDMETHODIMP GetTypeInfo(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo);
	STDMETHODIMP GetIDsOfNames(REFIID riid, LPOLESTR *rgszNames, UINT cNames, LCID lcid, DISPID *rgDispId);
	STDMETHODIMP Invoke(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags, DISPPARAMS *pDispParams, VARIANT *pVarResult, EXCEPINFO *pExcepInfo, UINT *puArgErr);

	CteBase();
	~CteBase();
private:
	LONG		m_cRef;
};

// Class Factory
class CteClassFactory : public IClassFactory
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();

	STDMETHODIMP CreateInstance(IUnknown *pUnkOuter, REFIID riid, void **ppvObject);
	STDMETHODIMP LockServer(BOOL fLock);
};
