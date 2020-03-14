#include "resource.h"
#include <windows.h>
#include <dispex.h>
#include <Shlobj.h>
#include <shobjidl.h>
#include <shlwapi.h>
#pragma comment (lib, "shlwapi.lib")

#pragma comment(lib, "Propsys.lib")

// 7-Zip
#include "cpp/7zip/IStream.h"
#include "cpp/7zip/IPassword.h"
#include "CPP/7zip/Archive/IArchive.h"

const IID IID_ISequentialInStream     = { 0x23170F69, 0x40C1, 0x278A, { 0x00, 0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x00} };
const IID IID_ISequentialOutStream    = { 0x23170F69, 0x40C1, 0x278A, { 0x00, 0x00, 0x00, 0x03, 0x00, 0x02, 0x00, 0x00} };
const IID IID_IInStream               = { 0x23170F69, 0x40C1, 0x278A, { 0x00, 0x00, 0x00, 0x03, 0x00, 0x03, 0x00, 0x00} };
const IID IID_IOutStream              = { 0x23170F69, 0x40C1, 0x278A, { 0x00, 0x00, 0x00, 0x03, 0x00, 0x04, 0x00, 0x00} };
const IID IID_IStreamGetSize          = { 0x23170F69, 0x40C1, 0x278A, { 0x00, 0x00, 0x00, 0x03, 0x00, 0x06, 0x00, 0x00} };
const IID IID_ICryptoGetTextPassword  = { 0x23170F69, 0x40C1, 0x278A, { 0x00, 0x00, 0x00, 0x05, 0x00, 0x10, 0x00, 0x00} };
const IID IID_IInArchive              = { 0x23170F69, 0x40C1, 0x278A, { 0x00, 0x00, 0x00, 0x06, 0x00, 0x60, 0x00, 0x00} };
const IID IID_IArchiveOpenCallback    = { 0x23170F69, 0x40C1, 0x278A, { 0x00, 0x00, 0x00, 0x06, 0x00, 0x10, 0x00, 0x00} };
const IID IID_IArchiveExtractCallback = { 0x23170F69, 0x40C1, 0x278A, { 0x00, 0x00, 0x00, 0x06, 0x00, 0x20, 0x00, 0x00} };

typedef HRESULT (WINAPI* LPFNGetNumberOfFormats)(UInt32 *);
typedef HRESULT (WINAPI* LPFNGetNumberOfMethods)(UInt32 *);
typedef HRESULT (WINAPI* LPFNGetMethodProperty)(UInt32 index, PROPID propID, PROPVARIANT * value);
typedef HRESULT (WINAPI* LPFNGetHandlerProperty2)(UInt32, PROPID propID, PROPVARIANT *);
typedef HRESULT (WINAPI* LPFNCreateObject)(const GUID *, const GUID *, void **);

//Plug in(Image)
typedef HRESULT(WINAPI* LPFNGetImage)(IStream *pStream, LPCWSTR lpPath, int cx, HBITMAP *phBM, int *pnAlpha);

#define T7Z_FilterList		0
#define T7Z_DisableList		1
#define T7Z_FilterExtract	2
#define T7Z_DisableExtract	3
#define T7Z_FilterUpdate	4
#define T7Z_DisableUpdate	5
#define T7Z_FilterContent	6
#define T7Z_DisableContent	7
#define T7Z_FilterPreview	8
#define T7Z_DisablePreview	9
#define T7Z_Path			10
#define T7Z_Strings			11

struct TEmethod
{
	LONG   id;
	LPWSTR name;
};

struct TECallback
{
	IUnknown *punkCallback;
	IUnknown *punkDB;
	VARIANT *pvResult;
};

#ifdef _WIN64
#define teSetPtr(pVar, nData)	teSetLL(pVar, (LONGLONG)nData)
#define GetPtrFromVariant(pv)	GetLLFromVariant(pv)
#else
#define teSetPtr(pVar, nData)	teSetLong(pVar, (LONG)nData)
#define GetPtrFromVariant(pv)	GetIntFromVariant(pv)
#endif

// 7-Zip Wrapper Object
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

class CteInStream : public IInStream
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();
	//ISequentialInStream
	STDMETHODIMP Read(void *data, UInt32 size, UInt32 *processedSize);
	//IInStream
	STDMETHODIMP Seek(Int64 offset, UInt32 seekOrigin, UInt64 *newPosition);

	CteInStream(IStream *pStream);
	~CteInStream();
private:
	LONG		m_cRef;
	IStream		*m_pStream;
};

class CteOutStream : public IOutStream
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();
	//ISequentialOutStream
	STDMETHODIMP Write(const void *data, UInt32 size, UInt32 *processedSize);
	//IOutStream
	STDMETHODIMP Seek(Int64 offset, UInt32 seekOrigin, UInt64 *newPosition);
	STDMETHODIMP SetSize(UInt64 newSize);

	CteOutStream(IStream *pStream);
	~CteOutStream();
private:
	LONG		m_cRef;
	IStream		*m_pStream;
};

class CteArchiveOpenCallback : public IArchiveOpenCallback, ICryptoGetTextPassword
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();
	//IArchiveOpenCallback
	STDMETHODIMP SetTotal(const UInt64 *files, const UInt64 *bytes);
	STDMETHODIMP SetCompleted(const UInt64 *files, const UInt64 *bytes);
	//ICryptoGetTextPassword
	STDMETHODIMP CryptoGetTextPassword(BSTR *password);

	CteArchiveOpenCallback(IDispatch *pdisp);
	~CteArchiveOpenCallback();
private:
	LONG		m_cRef;
	IDispatch	*m_pdisp;
	VARIANT		m_vGetPassword;
};

class CteArchiveExtractCallback : public IArchiveExtractCallback
{
public:
	STDMETHODIMP QueryInterface(REFIID riid, void **ppvObject);
	STDMETHODIMP_(ULONG) AddRef();
	STDMETHODIMP_(ULONG) Release();
	//IIArchiveExtractCallback
	STDMETHODIMP GetStream(UInt32 index, ISequentialOutStream **outStream, Int32 askExtractMode);
	STDMETHODIMP PrepareOperation(Int32 askExtractMode);
	STDMETHODIMP SetOperationResult(Int32 opRes);
	//IProgress
	STDMETHODIMP SetTotal(UInt64 total);
	STDMETHODIMP SetCompleted(const UInt64 *completeValue);
		
	CteArchiveExtractCallback(IInArchive *pInArchive, LPWSTR lpszFilter, int nFilter, int nDisable, IStream **ppStream, BSTR *pbsItem);
	~CteArchiveExtractCallback();
private:
	LONG		m_cRef;
	IStream		**m_ppStream;
	IInArchive	*m_pInArchive;
	LPWSTR		m_lpszFilter;
	int			m_nFilter;
	int			m_nDisable;
	BSTR		*m_pbsItem;
	BOOL		m_bDone;
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
