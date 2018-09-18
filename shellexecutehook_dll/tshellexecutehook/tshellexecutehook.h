#include "resource.h"
#include <windows.h>
#include <shlobj.h>
#include <shlwapi.h>
#pragma comment (lib, "shlwapi.lib")

#define FILTER_CONTROLPANEL L"::{26EE0668-A00A-44D7-9371-BEB064C98683}*"
#define FILTER_WINE10	L"*::{52205FD8-5DFB-447D-801A-D0B52F2E83E1}"

class CShellExecuteHook : public IShellExecuteHook
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();
	
	STDMETHODIMP Execute(LPSHELLEXECUTEINFO pei);
	
	CShellExecuteHook();
	~CShellExecuteHook();

private:
	LONG m_cRef;
};

class CClassFactory : public IClassFactory
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();
	
	STDMETHODIMP CreateInstance(IUnknown *pUnkOuter, REFIID riid, void **ppvObject);
	STDMETHODIMP LockServer(BOOL fLock);
};