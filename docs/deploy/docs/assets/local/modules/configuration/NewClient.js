import { ModalDialog } from "../../../common/modules/ModalDialog.js";

export class NewClient extends ModalDialog {
    constructor(id, issuer) {
        super(id);
        this.issuer = issuer;
    }
    fields() {
        return [
            "client_uri",
            "client_id",
            "client_secret",
            "redirect_uris",
            "initiate_login_uri",
            "scope",
        ];
    }
    async create_popup(section) {
        await super.create_popup(section);
        const form = section.querySelector("form");
        if ("writeText" in navigator.clipboard) {
            form.elements["copy"].addEventListener("click", async e => {
                form.elements["metadata"].focus();
                form.elements["metadata"].select();
                await navigator.clipboard.writeText(form.elements["metadata"].value);
            });
        } else {
            const e = form.elements["copy"];
            e.parentNode.removeChild(e);
        }
        if ("readText" in navigator.clipboard) {
            form.elements["paste"].addEventListener("click", async e => {
                const text = await navigator.clipboard.readText();
                if (text !== "") {
                    this.set_metadata(text, true);
                }
            });
        } else {
            const e = form.elements["paste"];
            e.parentNode.removeChild(e);
        }
        form.elements["clear"].addEventListener("click", async e => {
            this.set_metadata("{}", true);
            form.elements["metadata"].focus();
            form.elements["metadata"].select();
        });
        form.addEventListener("input", e => {
            if (e.target instanceof HTMLInputElement) {
                if (this.fields().includes(e.target.name)) {
                    const json = this.form_to_json();
                    this.set_metadata(JSON.stringify(json, null, 2));
                    this.set_error(false);
                    return;
                }
            }
            if (e.target instanceof HTMLTextAreaElement) {
                let json = {};
                try {
                    json = JSON.parse(e.target.value);
                    this.set_error(false);
                } catch {
                    this.set_error(true);
                }
                this.json_to_form(json);
            }
        });

        const redirect_uris = [
            new URL("authorization-code-flow.html", location.href),
        ];
        form.elements["redirect_uris"].value = redirect_uris.join(" ");

        const initiate_login_uri = new URL("index.html", location.href);
        if ("issuer" in this) {
            initiate_login_uri.searchParams.set("iss", this.issuer);
        }
        form.elements["initiate_login_uri"].value = initiate_login_uri;

        form.elements["client_uri"].value = new URL("index.html", location.href);

        form.elements["scope"].value = "openid";
        const json = this.form_to_json();
        this.set_metadata(JSON.stringify(json, null, 2), false);
        this.set_error(false);
        return section;
    }
    set_metadata(value, dispatch) {
        this.form.elements["metadata"].value = value;
        if (dispatch === true) {
            this.form.elements["metadata"].dispatchEvent(new CustomEvent("input", { bubbles: true }));
        }
    }
    get_metadata_json() {
        if (!this.isOpen()) return {};
        const value = this.form.elements["metadata"].value;
        if (value === null || /^\s*$/.test(value)) return {};
        try {
            return JSON.parse(value);
        } catch {
            return {};
        }
    }
    set_error(status) {
        this.form.elements["metadata"].classList.toggle("error", status === true);
    }
    form_to_json() {
        const json = {};
        for (const i of this.fields()) {
            const value = this.form.elements[i].value;
            if (value === null || /^\s*$/.test(value)) continue;
            if ("redirect_uris" === i) {
                json[i] = value.split(" ");
            } else {
                json[i] = value;
            }
        }
        return json;
    }
    json_to_form(json) {
        for (const i of this.fields()) {
            let value = "";
            if (i in json) {
                const t = json[i];
                if (Array.isArray(t)) {
                    value = t.join(" ");
                } else {
                    value = t;
                }
            }
            this.form.elements[i].value = value;
        }
    }
}
