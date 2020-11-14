var Addon_Id = "clipfolder";
if (window.Addon == 1) {
	importJScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", '<label>Filter</label><input type="text" name="Filter" style="width: 100%">');
	document.getElementById("panel7").insertAdjacentHTML("beforeend", '<br><label>Name</label>2<input type="text" name="MenuName2" style="width: 100%">');
}
