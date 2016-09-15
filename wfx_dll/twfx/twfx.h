#include "resource.h"
#include <windows.h>
#include <dispex.h>
#include <shlwapi.h>
#pragma comment (lib, "shlwapi.lib")

#define MAX_OBJ 64

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

// ids for FsGetFile
#define FS_FILE_OK 0
#define FS_FILE_EXISTS 1
#define FS_FILE_NOTFOUND 2
#define FS_FILE_READERROR 3
#define FS_FILE_WRITEERROR 4
#define FS_FILE_USERABORT 5
#define FS_FILE_NOTSUPPORTED 6
#define FS_FILE_EXISTSRESUMEALLOWED 7

#define FS_EXEC_OK 0
#define FS_EXEC_ERROR 1
#define FS_EXEC_YOURSELF -1
#define FS_EXEC_SYMLINK -2

#define FS_COPYFLAGS_OVERWRITE 1
#define FS_COPYFLAGS_RESUME 2
#define FS_COPYFLAGS_MOVE 4
#define FS_COPYFLAGS_EXISTS_SAMECASE 8
#define FS_COPYFLAGS_EXISTS_DIFFERENTCASE 16
 
// flags for tRequestProc
#define RT_Other 0
#define RT_UserName 1
#define RT_Password 2
#define RT_Account 3
#define RT_UserNameFirewall 4
#define RT_PasswordFirewall 5
#define RT_TargetDir 6
#define RT_URL 7
#define RT_MsgOK 8
#define RT_MsgYesNo 9
#define RT_MsgOKCancel 10

// flags for tLogProc
#define MSGTYPE_CONNECT 1
#define MSGTYPE_DISCONNECT 2
#define MSGTYPE_DETAILS 3
#define MSGTYPE_TRANSFERCOMPLETE 4
#define MSGTYPE_CONNECTCOMPLETE 5
#define MSGTYPE_IMPORTANTERROR 6
#define MSGTYPE_OPERATIONCOMPLETE 7

// flags for FsStatusInfo
#define FS_STATUS_START 0
#define FS_STATUS_END 1
#define FS_STATUS_OP_LIST 1
#define FS_STATUS_OP_GET_SINGLE 2
#define FS_STATUS_OP_GET_MULTI 3
#define FS_STATUS_OP_PUT_SINGLE 4
#define FS_STATUS_OP_PUT_MULTI 5
#define FS_STATUS_OP_RENMOV_SINGLE 6
#define FS_STATUS_OP_RENMOV_MULTI 7
#define FS_STATUS_OP_DELETE 8
#define FS_STATUS_OP_ATTRIB 9
#define FS_STATUS_OP_MKDIR 10
#define FS_STATUS_OP_EXEC 11
#define FS_STATUS_OP_CALCSIZE 12
#define FS_STATUS_OP_SEARCH 13
#define FS_STATUS_OP_SEARCH_TEXT 14
#define FS_STATUS_OP_SYNC_SEARCH 15
#define FS_STATUS_OP_SYNC_GET 16
#define FS_STATUS_OP_SYNC_PUT 17
#define FS_STATUS_OP_SYNC_DELETE 18
#define FS_STATUS_OP_GET_MULTI_THREAD 19
#define FS_STATUS_OP_PUT_MULTI_THREAD 20
#define FS_ICONFLAG_SMALL 1
#define FS_ICONFLAG_BACKGROUND 2
#define FS_ICON_USEDEFAULT 0
#define FS_ICON_EXTRACTED 1
#define FS_ICON_EXTRACTED_DESTROY 2
#define FS_ICON_DELAYED 3
#define FS_BITMAP_NONE 0
#define FS_BITMAP_EXTRACTED 1
#define FS_BITMAP_EXTRACT_YOURSELF 2
#define FS_BITMAP_EXTRACT_YOURSELF_ANDDELETE 3
#define FS_BITMAP_CACHE 256
#define FS_CRYPT_SAVE_PASSWORD 1
#define FS_CRYPT_LOAD_PASSWORD 2
#define FS_CRYPT_LOAD_PASSWORD_NO_UI 3 // Load password only if master password has already been entered!
#define FS_CRYPT_COPY_PASSWORD 4       // Copy encrypted password to new connection name
#define FS_CRYPT_MOVE_PASSWORD 5       // Move password when renaming a connection
#define FS_CRYPT_DELETE_PASSWORD 6     // Delete password
#define FS_CRYPTOPT_MASTERPASS_SET 1   // The user already has a master password defined
#define BG_DOWNLOAD 1                  // Plugin supports downloads in background
#define BG_UPLOAD 2                    // Plugin supports uploads in background
#define BG_ASK_USER 4                  // Plugin requires separate connection for background transfers -> ask user first

typedef struct {
    DWORD SizeLow,SizeHigh;
    FILETIME LastWriteTime;
    int Attr;
} RemoteInfoStruct;

typedef struct {
int size;
	DWORD PluginInterfaceVersionLow;
	DWORD PluginInterfaceVersionHi;
	char DefaultIniName[MAX_PATH];
} FsDefaultParamStruct;

// Total Commander File System Plug-in Callbacks
typedef int (__stdcall *tProgressProc)(int PluginNr,char* SourceName,char* TargetName,int PercentDone);
typedef int (__stdcall *tProgressProcW)(int PluginNr,WCHAR* SourceName,WCHAR* TargetName,int PercentDone);
typedef void (__stdcall *tLogProc)(int PluginNr,int MsgType,char* LogString);
typedef void (__stdcall *tLogProcW)(int PluginNr,int MsgType,WCHAR* LogString);
typedef BOOL (__stdcall *tRequestProc)(int PluginNr,int RequestType,char* CustomTitle,char* CustomText,char* ReturnedText,int maxlen);
typedef BOOL (__stdcall *tRequestProcW)(int PluginNr,int RequestType,WCHAR* CustomTitle,WCHAR* CustomText,WCHAR* ReturnedText,int maxlen);
typedef int (__stdcall *tCryptProc) (int PluginNr,int CryptoNumber,int mode,char* ConnectionName,char* Password,int maxlen);
typedef int (__stdcall *tCryptProcW) (int PluginNr,int CryptoNumber,int mode,WCHAR* ConnectionName,WCHAR* Password,int maxlen);

//typedef int (__stdcall *tCryptProc)(int PluginNr,int CryptoNr,int Mode, char* ConnectionName,char* Password,int maxlen);
//typedef int (__stdcall *tCryptProcW)(int PluginNr,int CryptoNr,int Mode, WCHAR* ConnectionName,WCHAR* Password,int maxlen);

// Total Commander File System Plug-in functions
typedef int (__stdcall *LPFN_FsInit) (int PluginNr,tProgressProc pProgressProc,tLogProc pLogProc,tRequestProc pRequestProc);
typedef int (__stdcall *LPFN_FsInitW) (int PluginNr,tProgressProcW pProgressProcW,tLogProcW pLogProcW,tRequestProcW pRequestProcW);
typedef HANDLE (__stdcall *LPFN_FsFindFirst) (char* Path,WIN32_FIND_DATAA *FindData);
typedef HANDLE (__stdcall *LPFN_FsFindFirstW) (WCHAR* Path,WIN32_FIND_DATAW *FindData);
typedef BOOL (__stdcall *LPFN_FsFindNext) (HANDLE Hdl,WIN32_FIND_DATAA *FindData);
typedef BOOL (__stdcall *LPFN_FsFindNextW) (HANDLE Hdl,WIN32_FIND_DATAW *FindData);
typedef int (__stdcall *LPFN_FsFindClose) (HANDLE Hdl);
typedef void (__stdcall *LPFN_FsGetDefRootName) (char* DefRootName,int maxlen);
typedef int (__stdcall *LPFN_FsGetFile) (char* RemoteName,char* LocalName,int CopyFlags,RemoteInfoStruct* ri);
typedef int (__stdcall *LPFN_FsGetFileW) (WCHAR* RemoteName,WCHAR* LocalName,int CopyFlags,RemoteInfoStruct* ri);
typedef int (__stdcall *LPFN_FsPutFile) (char* LocalName,char* RemoteName,int CopyFlags);
typedef int (__stdcall *LPFN_FsPutFileW) (WCHAR* LocalName,WCHAR* RemoteName,int CopyFlags);
typedef int (__stdcall *LPFN_FsRenMovFile) (char* OldName,char* NewName,BOOL Move,BOOL OverWrite,RemoteInfoStruct* ri);
typedef int (__stdcall *LPFN_FsRenMovFileW) (WCHAR* OldName,WCHAR* NewName,BOOL Move,BOOL OverWrite,RemoteInfoStruct* ri);
typedef BOOL (__stdcall *LPFN_FsDeleteFile) (char* RemoteName);
typedef BOOL (__stdcall *LPFN_FsDeleteFileW) (WCHAR* RemoteName);
typedef BOOL (__stdcall *LPFN_FsRemoveDir) (char* RemoteName);
typedef BOOL (__stdcall *LPFN_FsRemoveDirW) (WCHAR* RemoteName);
typedef BOOL (__stdcall *LPFN_FsMkDir) (char* Path);
typedef BOOL (__stdcall *LPFN_FsMkDirW) (WCHAR* Path);
typedef int (__stdcall *LPFN_FsExecuteFile) (HWND MainWin,char* RemoteName,char* Verb);
typedef int (__stdcall *LPFN_FsExecuteFileW) (HWND MainWin,WCHAR* RemoteName,WCHAR* Verb);
typedef BOOL (__stdcall *LPFN_FsSetAttr) (char* RemoteName,int NewAttr);
typedef BOOL (__stdcall *LPFN_FsSetAttrW) (WCHAR* RemoteName,int NewAttr);
typedef BOOL (__stdcall *LPFN_FsSetTime) (char* RemoteName,FILETIME *CreationTime,FILETIME *LastAccessTime,FILETIME *LastWriteTime);
typedef BOOL (__stdcall *LPFN_FsSetTimeW) (WCHAR* RemoteName,FILETIME *CreationTime,FILETIME *LastAccessTime,FILETIME *LastWriteTime);
typedef BOOL (__stdcall *LPFN_FsDisconnect) (char* DisconnectRoot);
typedef BOOL (__stdcall *LPFN_FsDisconnectW) (WCHAR* DisconnectRoot);
typedef int (__stdcall *LPFN_FsExtractCustomIcon) (char* RemoteName,int ExtractFlags,HICON* TheIcon);
typedef int (__stdcall *LPFN_FsExtractCustomIconW) (WCHAR* RemoteName,int ExtractFlags,HICON* TheIcon);
typedef void (__stdcall *LPFN_FsSetCryptCallback) (tCryptProc pCryptProc,int CryptoNr,int Flags);
typedef void (__stdcall *LPFN_FsSetCryptCallbackW) (tCryptProcW pCryptProc,int CryptoNr,int Flags);
typedef void (__stdcall *LPFN_FsSetDefaultParams) (FsDefaultParamStruct* dps);

// Total Commander File System Plugin Wrapper Object
class CteWFX : public IDispatch
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

	CteWFX(HMODULE hDll, LPWSTR lpLib);
	~CteWFX();

	VOID Close();
	VOID SetChangeVolProc(HANDLE hArcData);
	VOID SetProcessDataProc(HANDLE hArcData);

	LPFN_FsInit FsInit;
	LPFN_FsInitW FsInitW;
	LPFN_FsFindFirst FsFindFirst;
	LPFN_FsFindFirstW FsFindFirstW;
	LPFN_FsFindNext FsFindNext;
	LPFN_FsFindNextW FsFindNextW;
	LPFN_FsFindClose FsFindClose;
	LPFN_FsGetDefRootName FsGetDefRootName;
	LPFN_FsGetFile FsGetFile;
	LPFN_FsGetFileW FsGetFileW;
	LPFN_FsPutFile FsPutFile;
	LPFN_FsPutFileW FsPutFileW;
	LPFN_FsRenMovFile FsRenMovFile;
	LPFN_FsRenMovFileW FsRenMovFileW;
	LPFN_FsDeleteFile FsDeleteFile;
	LPFN_FsDeleteFileW FsDeleteFileW;
	LPFN_FsRemoveDir FsRemoveDir;
	LPFN_FsRemoveDirW FsRemoveDirW;
	LPFN_FsMkDir FsMkDir;
	LPFN_FsMkDirW FsMkDirW;
	LPFN_FsExecuteFile FsExecuteFile;
	LPFN_FsExecuteFileW FsExecuteFileW;
	LPFN_FsSetAttr FsSetAttr;
	LPFN_FsSetAttrW FsSetAttrW;
	LPFN_FsSetTime FsSetTime;
	LPFN_FsSetTimeW FsSetTimeW;
	LPFN_FsDisconnect FsDisconnect;
	LPFN_FsDisconnectW FsDisconnectW;
	LPFN_FsExtractCustomIcon FsExtractCustomIcon;
	LPFN_FsExtractCustomIconW FsExtractCustomIconW;
	LPFN_FsSetCryptCallback FsSetCryptCallback;
	LPFN_FsSetCryptCallbackW FsSetCryptCallbackW;
	LPFN_FsSetDefaultParams FsSetDefaultParams;

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
