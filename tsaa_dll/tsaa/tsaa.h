#include <shobjidl.h>
#include <Shlobj.h>
#include <shlwapi.h>
#pragma comment (lib, "shlwapi.lib")
#include <vector>

struct TEExists
{
	LPITEMIDLIST pidl;
	BOOL bExists;
};

//Plug in (MessageSFVCB)
typedef HRESULT (WINAPI* LPFNMessageSFVCB)(ICommDlgBrowser2 *pSB, IShellFolder2 *pSF2, IShellView *pSV, UINT uMsg, WPARAM wParam, LPARAM lParam);
