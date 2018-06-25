if (window.Addon == 1) {
	FolderMenu.SortMode = GetAddonOptionEx("foldermenusettings", "Sort");
	FolderMenu.SortReverse = GetAddonOptionEx("foldermenusettings", "Order");
} else {
	var s = ['<label>@shell32.dll,-50690[Arrange by:]</label><input type="text" name="Sort" style="display: none" /><br />'];
	s.push('<input type="radio" name="_Sort" id="Sort=-1" value="-1" onclick="SetRadio(this)" /><label for="Sort=-1">@shell32.dll,-9808</label><br />');
	s.push('<input type="radio" name="_Sort" id="Sort=0" value="0" onclick="SetRadio(this)" checked /><label for="Sort=0">@shell32.dll,-8976</label><br />');
	s.push('<input type="radio" name="_Sort" id="Sort=1" value="1" onclick="SetRadio(this)" /><label for="Sort=1">@shell32.dll,-8978</label><br />');
	s.push('<input type="radio" name="_Sort" id="Sort=3" value="3" onclick="SetRadio(this)" /><label for="Sort=3">@shell32.dll,-8980</label><br />');
	s.push('<input type="text" name="Order" style="display: none" /><br />');
	s.push('<input type="radio" name="_Order" id="Order=0" value="0" onclick="SetRadio(this)" checked /><label for="Order=0">@shell32.dll,-4499[Arrange items in ascending order.]</label><br />');
	s.push('<input type="radio" name="_Order" id="Order=1" value="1" onclick="SetRadio(this)" /><label for="Order=1">@shell32.dll,-4500[Arrange items in descending order.]</label><br />');
	SetTabContents(0, "General", s);
}