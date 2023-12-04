class ModalDialog {
    constructor(id, src, http) {
        this.id = id;
        if (src !== null && src !== undefined) {
            this.src = src;
        }
        if (http !== null && http !== undefined) {
            this._http = _http;
        }
        this._section = document.createElement("section");
        this._section.classList.add("popup");
    }
    // test if dialog is opened
    isOpen() {
        return this._section.parentNode !== null;
    }
    get section() {
        return this._section;
    }
    get form() {
        return this.section.querySelector("form");
    }
    // submit listener
    onsubmit(listener) {
        this.section.addEventListener("dialog-submit", listener);
    }
    // form submit event handler
    async submit(e) {
        e.preventDefault();
        const detail = {
            close: () => this.close(),
            dialog: this,
            form: this.form,
        }
        this.section.dispatchEvent(new CustomEvent("dialog-submit", { detail: detail }));
        // this.close();
    }
    // form reset event handler
    reset(e) {
        this.close();
    }
    // document focusin event handler
    // - implements focus trapping inside dialog
    focusin(e) {
        if (!this.isOpen()) {
            return;
        }
        if (this.section.contains(e.target)) {
            return;
        }
        e.target.blur();
    }
    // set focus on first element of dialog
    focus() {
        if (!this.isOpen()) return;
        const t = document.querySelector(":focus");
        if (t !== null) t.blur();
        const form = this.section.querySelector("form");
        if (form === null) return;
        for (const i of form.elements) {
            i.focus();
            if (i === form.querySelector(":focus")) {
                break;
            }
        }
    }
    // returns inline template
    async inline_template() {
        const template = document.getElementById(this.id);
        if (!(template instanceof HTMLTemplateElement)) throw "invalid argument";
        return template;
    }
    // return template by fetch 
    async fetch_template(uri) {
        if (!("_http" in this)) {
            const module = await import("./fetch.js");
            this._http = new module.HttpClient();
        }
        const html = await this._http.get_html(uri);
        const template = html.getElementById(this.id);
        if (!(template instanceof HTMLTemplateElement)) throw "invalid argument";
        return template;
    }
    //async getTemplate() { return await this.fetch_template("form-template.html"); }
    async getTemplate() {
        return ("src" in this)
            ? await this.fetch_template(this.src)
            : await this.inline_template();
    }
    // create pupup html from template
    async create_popup(section) {
        const template = await this.getTemplate();
        section.appendChild(template.content.cloneNode(true));
        const form = section.querySelector("form");
        form.addEventListener("submit", e => this.submit(e));
        form.addEventListener("reset", e => this.reset(e));
    }
    // open modal dialog
    async open() {
        if (this.isOpen()) return;
        await this.create_popup(this.section);
        this._focusin = e => this.focusin(e);
        document.addEventListener("focusin", this._focusin);
        document.body.appendChild(this.section);
        this.focus();
    }
    // close modal dialog
    close() {
        document.body.removeChild(this.section);
        this.section.innerHTML = "";
        document.removeEventListener("focusin", this._focusin);
        delete this._focusin;
    }
}

export { ModalDialog };
