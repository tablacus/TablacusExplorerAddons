#include "resource.h"
#include <windows.h>
#include <dispex.h>
#include <vector>
#include <unordered_map>
#include <shlwapi.h>
#pragma comment (lib, "shlwapi.lib")

#define TE_METHOD		0x60010000
#define TE_METHOD_MAX	0x6001ffff
#define TE_METHOD_MASK	0x0000ffff
#define TE_PROPERTY		0x40010000

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

// Total Commander Packer Plug-in consts

#define E_SUCCESS          0
#define E_END_ARCHIVE     10
#define E_NO_MEMORY       11
#define E_BAD_DATA        12
#define E_BAD_ARCHIVE     13
#define E_UNKNOWN_FORMAT  14
#define E_EOPEN           15
#define E_ECREATE         16
#define E_ECLOSE          17
#define E_EREAD           18
#define E_EWRITE          19
#define E_SMALL_BUF       20
#define E_EABORTED        21
#define E_NO_FILES        22
#define E_TOO_MANY_FILES  23
#define E_NOT_SUPPORTED   24

#define PK_OM_LIST          0
#define PK_OM_EXTRACT       1

#define PK_SKIP             0
#define PK_TEST             1
#define PK_EXTRACT          2

#define PK_VOL_ASK          0
#define PK_VOL_NOTIFY       1

#define PK_PACK_MOVE_FILES  1
#define PK_PACK_SAVE_PATHS  2
#define PK_PACK_ENCRYPT     4

#define PK_CAPS_NEW         1
#define PK_CAPS_MODIFY      2
#define PK_CAPS_MULTIPLE    4
#define PK_CAPS_DELETE      8
#define PK_CAPS_OPTIONS    16
#define PK_CAPS_MEMPACK    32
#define PK_CAPS_BY_CONTENT 64
#define PK_CAPS_SEARCHTEXT 128
#define PK_CAPS_HIDE       256
#define PK_CAPS_ENCRYPT    512
#define BACKGROUND_UNPACK   1
#define BACKGROUND_PACK     2
#define BACKGROUND_MEMPACK  4

// Total Commander Packer Plug-in Structures

typedef struct{
	char ArcName[260];
	char FileName[260];
	int Flags;
	int PackSize;
	int UnpSize;
	int HostOS;
	int FileCRC;
	int FileTime;
	int UnpVer;
	int Format;
	int FileAttr;
	char* CmtBuf;
	int CmtBufSize;
	int CmtSize;
	int CmtState;
} tHeaderData;

typedef struct{
	char ArcName[1024];
	char FileName[1024];
	int Flags;
	unsigned int PackSize;
	unsigned int PackSizeHigh;
	unsigned int UnpSize;
	unsigned int UnpSizeHigh;
	int HostOS;
	int FileCRC;
	int FileTime;
	int UnpVer;
	int Format;
	int FileAttr;
	char* CmtBuf;
	int CmtBufSize;
	int CmtSize;
	int CmtState;
	char Reserved[1024];
} tHeaderDataEx;

typedef struct{
	WCHAR ArcName[1024];
	WCHAR FileName[1024];
	int Flags;
	unsigned int PackSize;
	unsigned int PackSizeHigh;
	unsigned int UnpSize;
	unsigned int UnpSizeHigh;
	int HostOS;
	int FileCRC;
	int FileTime;
	int UnpVer;
	int Format;
	int FileAttr;
	char* CmtBuf;
	int CmtBufSize;
	int CmtSize;
	int CmtState;
	char Reserved[1024];
} tHeaderDataExW;

typedef struct{
	char* ArcName;
	int OpenMode;
	int OpenResult;
	char* CmtBuf;
	int CmtBufSize;
	int CmtSize;
	int CmtState;
} tOpenArchiveData;

typedef struct{
	WCHAR* ArcName;
	int OpenMode;
	int OpenResult;
	WCHAR* CmtBuf;
	int CmtBufSize;
	int CmtSize;
	int CmtState;
} tOpenArchiveDataW;

typedef struct {
	int size;
	DWORD PluginInterfaceVersionLow;
	DWORD PluginInterfaceVersionHi;
	char DefaultIniName[MAX_PATH];
} PackDefaultParamStruct;


// Total Commander Packer Plug-in Callbacks

typedef int (__stdcall *tChangeVolProc)(char *ArcName, int Mode);
typedef int (__stdcall *tChangeVolProcW)(WCHAR *ArcName, int Mode);
typedef int (__stdcall *tProcessDataProc)(char *FileName, int Size);
typedef int (__stdcall *tProcessDataProcW)(WCHAR *FileName, int Size);

// Total Commander Packer Plug-in functions

typedef HANDLE (__stdcall *LPFNWCX_OpenArchive) (tOpenArchiveData *ArchiveData);
typedef HANDLE (__stdcall *LPFNWCX_OpenArchiveW) (tOpenArchiveDataW *ArchiveData);
typedef int (__stdcall *LPFNWCX_ReadHeader) (HANDLE hArcData, tHeaderData *HeaderData);
typedef int (__stdcall *LPFNWCX_ReadHeaderEx) (HANDLE hArcData, tHeaderDataEx *HeaderDataEx);
typedef int (__stdcall *LPFNWCX_ReadHeaderExW) (HANDLE hArcData, tHeaderDataExW *HeaderDataEx);
typedef int (__stdcall *LPFNWCX_ProcessFile) (HANDLE hArcData, int Operation, char *DestPath, char *DestName);
typedef int (__stdcall *LPFNWCX_ProcessFileW) (HANDLE hArcData, int Operation, WCHAR *DestPath, WCHAR *DestName);
typedef int (__stdcall *LPFNWCX_CloseArchive) (HANDLE hArcData);
typedef void (__stdcall *LPFNWCX_SetChangeVolProc) (HANDLE hArcData, tChangeVolProc pChangeVolProc1);
typedef void (__stdcall *LPFNWCX_SetChangeVolProcW) (HANDLE hArcData, tChangeVolProcW pChangeVolProc1);
typedef void (__stdcall *LPFNWCX_SetProcessDataProc) (HANDLE hArcData, tProcessDataProc pProcessDataProc);
typedef void (__stdcall *LPFNWCX_SetProcessDataProcW) (HANDLE hArcData, tProcessDataProcW pProcessDataProc);
typedef int (__stdcall *LPFNWCX_PackFiles) (char *PackedFile, char *SubPath, char *SrcPath, char *AddList, int Flags);
typedef int (__stdcall *LPFNWCX_PackFilesW) (WCHAR *PackedFile, WCHAR *SubPath, WCHAR *SrcPath, WCHAR *AddList, int Flags);
typedef int (__stdcall *LPFNWCX_DeleteFiles) (char *PackedFile, char *DeleteList);
typedef int (__stdcall *LPFNWCX_DeleteFilesW) (WCHAR *PackedFile, WCHAR *DeleteList);
typedef BOOL (__stdcall *LPFNWCX_CanYouHandleThisFile) (char *FileName);
typedef BOOL (__stdcall *LPFNWCX_CanYouHandleThisFileW) (WCHAR *FileName);
typedef void (__stdcall *LPFNWCX_ConfigurePacker) (HWND Parent, HINSTANCE DllInstance);
typedef void (__stdcall *LPFNWCX_PackSetDefaultParams) (PackDefaultParamStruct* dps);

// Total Commander Packer Plugin Wrapper Object
class CteWCX : public IDispatch
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

	CteWCX(HMODULE hDll, LPWSTR lpLib);
	~CteWCX();

	VOID Close();
	VOID SetProcEx(HANDLE hArcData, int n);

	LPFNWCX_OpenArchive WCX_OpenArchive;
	LPFNWCX_OpenArchiveW WCX_OpenArchiveW;
	LPFNWCX_ReadHeader WCX_ReadHeader;
	LPFNWCX_ReadHeaderEx WCX_ReadHeaderEx;
	LPFNWCX_ReadHeaderExW WCX_ReadHeaderExW;
	LPFNWCX_ProcessFile WCX_ProcessFile;
	LPFNWCX_ProcessFileW WCX_ProcessFileW;
	LPFNWCX_CloseArchive WCX_CloseArchive;
	LPFNWCX_SetChangeVolProc WCX_SetChangeVolProc;
	LPFNWCX_SetChangeVolProcW WCX_SetChangeVolProcW;
	LPFNWCX_SetProcessDataProc WCX_SetProcessDataProc;
	LPFNWCX_SetProcessDataProcW WCX_SetProcessDataProcW;
	LPFNWCX_PackFiles WCX_PackFiles;
	LPFNWCX_PackFilesW WCX_PackFilesW;
	LPFNWCX_DeleteFiles WCX_DeleteFiles;
	LPFNWCX_DeleteFilesW WCX_DeleteFilesW;
	LPFNWCX_CanYouHandleThisFile WCX_CanYouHandleThisFile;
	LPFNWCX_CanYouHandleThisFileW WCX_CanYouHandleThisFileW;
	LPFNWCX_ConfigurePacker WCX_ConfigurePacker;
	LPFNWCX_PackSetDefaultParams WCX_PackSetDefaultParams;

	HMODULE		m_hDll;
	BSTR		m_bsLib;
private:
	LONG		m_cRef;
};

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

//CteDispatch
class CteDispatch : public IDispatch
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

	CteDispatch(IDispatch *pDispatch, int nMode, DISPID dispId);
	~CteDispatch();

	VOID Clear();
public:
	DISPID		m_dispIdMember;
private:
	IDispatch	*m_pDispatch;
	LONG		m_cRef;
};
