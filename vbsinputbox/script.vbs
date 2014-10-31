Option Explicit

function vbInputBox(text, defaultText)
	vbInputBox = InputBox(GetText(text), TITLE, defaultText)
end function

Set InputDialog = GetRef("vbInputBox")
