#include <shobjidl.h>
#include <Shlobj.h>
#include <shlwapi.h>
#pragma comment (lib, "shlwapi.lib")
#include <deque>

//Plug in(Image)
typedef HRESULT (WINAPI* LPFNGetImage)(IStream *pStream, LPCWSTR lpPath, int cx, HBITMAP *phBM, int *pnAlpha);

struct TEFOLDER
{
	IStorage *pStorage;
	BSTR bsPath;
};

#define SQLITE_OK           0
#define SQLITE_ERROR        1
#define SQLITE_INTERNAL     2
#define SQLITE_PERM         3
#define SQLITE_ABORT        4
#define SQLITE_BUSY         5
#define SQLITE_LOCKED       6
#define SQLITE_NOMEM        7
#define SQLITE_READONLY     8
#define SQLITE_INTERRUPT    9
#define SQLITE_IOERR       10
#define SQLITE_CORRUPT     11
#define SQLITE_NOTFOUND    12
#define SQLITE_FULL        13
#define SQLITE_CANTOPEN    14
#define SQLITE_PROTOCOL    15
#define SQLITE_EMPTY       16
#define SQLITE_SCHEMA      17
#define SQLITE_TOOBIG      18
#define SQLITE_CONSTRAINT  19
#define SQLITE_MISMATCH    20
#define SQLITE_MISUSE      21
#define SQLITE_NOLFS       22
#define SQLITE_AUTH        23
#define SQLITE_ROW         100
#define SQLITE_DONE        101

// SQLite3 struct
typedef struct sqlite3 sqlite3;

//SQLite3 callback
typedef int(__cdecl *LPFN_sqlite3_callback)(void *pArg, int argc, char **argv, char **columnNames);
//winsqlite3.dll
typedef int(__stdcall *LPFN_win_sqlite3_callback)(void *pArg, int argc, char **argv, char **columnNames);

// SQLite3 functions
typedef int(__cdecl *LPFN_sqlite3_open)(char *, sqlite3 **);
typedef int(__cdecl *LPFN_sqlite3_exec)(sqlite3 *, const char *, LPFN_sqlite3_callback, void *, char **);
typedef int(__cdecl *LPFN_sqlite3_close)(sqlite3 *);
//winsqlite3.dll
typedef int(__stdcall *LPFN_win_sqlite3_open)(char *, sqlite3 **);
typedef int(__stdcall *LPFN_win_sqlite3_exec)(sqlite3 *, const char *, LPFN_win_sqlite3_callback, void *, char **);
typedef int(__stdcall *LPFN_win_sqlite3_close)(sqlite3 *);
