Option Explicit

function vbInputBox(text, defaultText)
	vbInputBox = InputBox(text, "Tablacus Explorer", defaultText)
end function

Set InputDialog = GetRef("vbInputBox")
