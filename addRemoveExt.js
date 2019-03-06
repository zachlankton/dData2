document.addEventListener("click", function clickWatch(ev) {
    var templates = dDataProto.templates;
    if (ev.target.nodeName == "BUTTON" && ev.target.hasAttribute("add")) {
        var templateId = ev.target.getAttribute("add");
        var template = templates[templateId];
        var toElement = document.querySelector(`[template-parent="${templateId}"]`);
        addTemplate(template, toElement);
    }

    if (ev.target.nodeName == "BUTTON" && ev.target.hasAttribute("remove")) {
        var elm = ev.target.parentElement;
        while (!elm.hasAttribute("d-data")) {
            elm = elm.parentElement;
        }
        elm.remove();
    }
});
