import { LitElement, html, customElement, property, internalProperty } from 'lit-element';
import lunr from 'lunr';

interface Icon {
    id: string;
    name: string;
    codepoint: string;
    aliases: string[];
    tags: string[];
    author: string;
    version: string;
}

@customElement('mdi-icon-picker')
export class MdiIconPicker extends LitElement {

    // Declare observed properties
    @property()
    fontUrl: string = '';

    @internalProperty()
    searchResults: Icon[] = [];

    searchIndex: lunr.Index = lunr(() => { });
    iconMap: Map<string, Icon> = new Map();

    constructor() {
        super();
        this.loadData();
    }

    async loadData() {
        const res = await fetch('https://raw.githubusercontent.com/Templarian/MaterialDesign/master/meta.json');
        const data: Icon[] = await res.json();
        data.forEach(i => this.iconMap.set(i.id, i));
        this.searchIndex = lunr(function () {
            this.ref('id');
            this.field('name');
            this.field('aliases');
            this.field('tags');
            data.forEach(i => this.add(i), this);
        });
    }

    _launchSearch(event: KeyboardEvent) {
        const value = (event.target as HTMLInputElement).value;
        if (!value || value.length === 0) {
            this.searchResults = [];
            return;
        }
        this.searchResults = this.searchIndex
            .search(value + '*')
            .map(si => (this.iconMap.get(si.ref) as Icon));
        console.log(this.searchResults)
    }

    // Define the element's template
    render() {
        return html`
            <link rel=stylesheet href="${this.fontUrl}">
            <input @keyup="${this._launchSearch}" />
            ${this.searchResults.slice(0, 100).map(i => html`<span class="mdi mdi-${i.name}"></span>`)}
        `;
    }
}
