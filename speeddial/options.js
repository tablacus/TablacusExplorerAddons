var s = ['<label>Replace</label><br />'];
s.push('<input type="checkbox" id="!NoHome" /><label for="!NoHome">New tab</label>');
s.push('<br /><br /><label>Add</label><br />');
s.push('<input type="checkbox" id="AddToMenu" /><label for="AddToMenu">Menus</label>');
SetTabContents(0, "General", s);
