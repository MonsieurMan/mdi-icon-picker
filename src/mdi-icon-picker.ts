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

    @internalProperty()
    selectedIcon?: Icon;

    @internalProperty()
    showResults = false;

    searchIndex: lunr.Index = lunr(() => { });
    iconMap: Map<string, Icon> = new Map();

    constructor() {
        super();
        this.loadData();
        this.addEventListener('focusin', () => {
            this.showResults = true;
        });
        this.addEventListener('focusout', () => {
            setTimeout(() => {
                this.showResults = false;
            }, 100);
        });
    }

    async loadData() {
        const res = await fetch('https://raw.githubusercontent.com/Templarian/MaterialDesign/master/meta.json');
        const data: Icon[] = await res.json();
        data.forEach(i => this.iconMap.set(i.id, i));
        // data.map(i => ({name: i.name, aliases: i.aliases, tags: i.tags}));
        this.searchIndex = lunr(function () {
            this.ref('id');
            this.field('name');
            this.field('aliases');
            this.field('tags');
            data.forEach(i => this.add(i), this);
        });
    }

    _launchSearch(event: KeyboardEvent) {
        this.showResults = true;
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

    _handleClick(icon: Icon) {
        this.selectedIcon = icon;
        console.log(icon.name);
        this.showResults = false;
    }

    firstUpdated() {
        // Marche pas
        const el = this.querySelector('[slot=input]') as HTMLInputElement;
        el?.addEventListener('keyup', this._launchSearch.bind(this));

    }

    // Define the element's template
    render() {
        return html`
            <link rel="stylesheet" href="${this.fontUrl}">
            <style>
                :host {
                    position: relative;
                    display: inline-block;
                }
                :host(:focus-within) > .results {
                    visibility: visible;
                }
                .icon-btn {
                    display: inline-flex;
                    height: 32px;
                    width: 32px;
                    border-radius: 4px;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .icon-btn:hover {
                    background-color: #e4e4ea;
                }
                .results {
                    width: calc(32px * 7 + 24px);
                    z-index: 1;
                    background-color: white;
                    visibility: hidden;
                    position: absolute;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    padding: 2px;
                }
                [visible] {
                    visibility: visible;
                }
            </style>
            ${this.selectedIcon !== undefined
                ? html`<span class="mdi mdi-${this.selectedIcon.name}"></span>`
                : ''
            }
            <slot name="input"><input @keyup="${this._launchSearch}" /></slot>
            <div class="results" ?visible="${this.showResults}">
                ${this.searchResults.slice(0, 100).map(i => html`
                    <div class="icon-btn" @click="${() => this._handleClick(i)}">
                        <span class="mdi mdi-${i.name}"></span>
                    </div>
                `)}
            </div>
        `;
    }
}
