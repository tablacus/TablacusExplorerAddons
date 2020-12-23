Option Explicit

function vbInputBox(text, defaultText)
	vbInputBox = InputBox(GetTextR(text), TITLE, defaultText)
end function

AddEvent "InputDialog", GetRef("vbInputBox")
