
window.dDataProto = {};
window.dData = {};

Object.setPrototypeOf(dData, dDataProto);

dDataProto.templates = {};

dDataProto.cacheTemplates = function() {
    var dDataElements = document.querySelectorAll("[d-data]");
    var dDataLen = dDataElements.length;
    var templatesToRender = [];

    // first label all template parents and strip template ("d-data") elements from the DOM
    for (var i = 0; i < dDataLen; i++) {
        var elem = dDataElements[i];
        var name = elem.getAttribute("name");
        if (this.isDDataChild(elem)) {
            elem.parentElement.setAttribute("template-parent", name);
            elem.remove();
            //if this d-data element is top level, replace it with wrapper div and 
            // add it to d-data global
        } else {
            var div = document.createElement("div");
            div.setAttribute("template-parent", name);
            elem.parentElement.insertBefore(div, elem);
            dDataProto.setupDataObject(div, name);
            elem.remove();
            templatesToRender.push(name);
        }
    }

    for (var i = 0; i < dDataLen; i++) {
        var elem = dDataElements[i];
        var name = elem.getAttribute("name");
        dDataProto.createTemplate(elem, name);
    }

    var tLen = templatesToRender.length;
    for (var i = 0; i < tLen; i++) {
        var name = templatesToRender[i];
        dData[name] = {};
    }

}

dDataProto.createTemplate = function(element, name) {
    var template = document.createElement("template");
    template.content.appendChild(element);
    dDataProto.templates[name] = template;
}

dDataProto.isDDataChild = function(elem) {
    var isChild = false;
    while (elem.parentElement != document.body) {
        if (elem.parentElement.hasAttribute("d-data")) {
            isChild = true;
            break;
        }
        elem = elem.parentElement;
    }
    return isChild;
}

dDataProto.setupDataObject = function(elem, name) {
    window.dataElms = {};

    Object.defineProperty(dData, name, {
        get,
        set
    });

    function get() {
        return dDataGet(elem.children[0])
    }

    function set(data) {
        elem.innerHTML = "";
        return addTemplate(dDataProto.templates[name], elem, data);
    }
}

function render() {
    var elmsToRender = document.querySelectorAll("[render]");
    var elmsLen = elmsToRender.length;

    for (var i = 0; i < elmsLen; i++) {
        var elm = elmsToRender[i];
        var template = elm.getAttribute("render");
        template = templates[template];
        addTemplate(template, elm);
    }
}

dData.cacheTemplates();

// render();

function dDataGet(selector) {

    var parentElm = undefined;
    if (selector.attributes != undefined) {
        // Selector can be either a string or an actual element
        parentElm = selector;
    } else {
        parentElm = document.querySelector(selector);
    }

    var dDataObject = {};
    Object.defineProperty(dDataObject, "element", {
        value: parentElm
    });

    var props = parentElm.querySelectorAll("[name]");
    var propsLen = props.length;

    for (var i = 0; i < propsLen; i++) {
        var propElm = props[i];
        var propName = propElm.getAttribute("name")
        if (belongsToCurrentParent(propElm)) {
            if (hasChildren(propElm)) {
                if (isArray(propElm)) {
                    // There are multiple instances of this property with children
                    dDataArrProp(propElm);
                } else {
                    // This is a single instance of this property with children
                    dDataObjProp(propElm);
                }
            } else {
                // This property is a single value property
                dDataValProp(propElm);

            }
        }

    }

    return dDataObject;

    function dDataArrProp(e) {
        if (dDataObject[propName] == undefined) {
            dDataObject[propName] = [];
            Object.defineProperty(dDataObject[propName], "element", {
                value: propElm.parentElement
            });
        }
        dDataObject[propName].push(dDataGet(e));
    }

    function dDataObjProp(e) {
        dDataObject[propName] = dDataGet(e);
    }

    function dDataValProp(e) {
        Object.defineProperty(dDataObject, propName, {
            get,
            set,
            enumerable: true
        });

        Object.defineProperty(dDataObject, propName + "Element", {
            value: propElm
        });

        function get() {
            return e.value || e.innerHTML;
        }

        function set(newVal) {
            if (e.value != undefined) {
                e.value = newVal
            } else {
                e.innerHTML = newVal;
            }
        }
    }

    function belongsToCurrentParent(e) {
        e = e.parentElement;
        while (!e.hasAttribute("name") && e != parentElm) {
            e = e.parentElement;
            if (e == null) {
                break;
            }
        }
        if (e == parentElm) {
            return true;
        } else {
            return false;
        }
    }

    function hasChildren(e) {
        var children = e.querySelector("[name]");
        var isArr = e.hasAttribute("array");
        var isObj = e.hasAttribute("object");

        if (children != null || isArr || isObj) {
            return true;
        } else {
            return false;
        }
    }

    function isArray(e) {
        var isArr = e.hasAttribute("array");
        var isObj = e.hasAttribute("object");

        if (isArr || !isObj) {
            return true;
        } else {
            return false;
        }
    }
}

function dDataSet(docFrag, data) {
    var templates = dDataProto.templates;
    for (var key in data) {

        if (typeof (data[key]) == "object") {
            var propParent = docFrag.querySelector(`[template-parent="${key}"]`);

            if (Array.isArray(data[key])) {
                var arr = data[key];
                var arrLen = arr.length;
                for (var i = 0; i < arrLen; i++) {
                    if (propParent == null) {
                        var parent = docFrag.querySelector("[d-data]");
                        addHiddenDiv(parent, key, arr[i]);
                    } else {
                        addTemplate(templates[key], propParent, arr[i])
                    }
                }
            } else {
                if (propParent == null) {
                    var parent = docFrag.querySelector("[d-data]");
                    addHiddenDiv(parent, key, data[key], true);
                } else {
                    addTemplate(templates[key], propParent, data[key]);
                }
            }

        } else {
            var elm = docFrag.querySelector(`[name="${key}"]`);
            if (elm == null) {// element does not exist
                var parent = docFrag.querySelector("[d-data]"); 
                addHiddenInput(parent, key, data[key]);
            } else { // element exists to apply value to
                if (elm.value != undefined) {
                    elm.value = data[key];
                } else {
                    elm.innerHTML = data[key];
                }
            }

        }

    }

}

function addTemplate(template, toElement, data) {

    var clone = document.importNode(template.content, true);
    if (data) {
        dDataSet(clone, data);
    }
    var retElem = clone.children[0];
    toElement.appendChild(clone);
    return retElem;

}

function addHiddenDiv(docFrag, key, data, objectBool) {
    var template = document.createElement("template");
    var div = document.createElement("div");
    template.content.appendChild(div);

    div.style.display = "none";
    div.setAttribute("d-data", "");
    div.setAttribute("name", key);
    if (objectBool){div.setAttribute("object", "")}
    return addTemplate(template, docFrag, data);
}

function addHiddenInput(docFrag, key, data) {
    var input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = data;
    docFrag.appendChild(input);
}
