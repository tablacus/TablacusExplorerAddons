EnableInner();
var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
    SetTabContents(0, "General", ado.ReadText(adReadAll));
    ado.Close();
}

SwitchExtract = function (o) {
    document.F.Extract.value = o.checked ? "*" : "";
}

ChangeExtract = function () {
    document.F.elements["_Extract"].checked = document.F.Extract.value != "";
}
