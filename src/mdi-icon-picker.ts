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
    defaultResults: Icon[] = [];

    constructor() {
        super();
        this.loadData();
        this.addEventListener('focusout', () => {
            setTimeout(() => {
                if (document.activeElement === this.input) return; // Fix display of results when using non default input.
                this.showResults = false;
            }, 100);
        });
    }

    async loadData() {
        // TODO: Allow the user to fetch it.
        const res = await fetch('https://raw.githubusercontent.com/Templarian/MaterialDesign/master/meta.json');
        const data: Icon[] = await res.json();
        this.defaultResults = data;
        this.searchResults = data;
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
            this.searchResults = this.defaultResults;
            return;
        }

        this.searchResults = this.searchIndex
            .search(value + '*')
            .map(si => (this.iconMap.get(si.ref) as Icon));
    }

    _selectIcon(icon: Icon) {
        this.selectedIcon = icon;
        this.showResults = false;
    }

    /**
     * Returns either the default input, or the slotted element.
     */
    private get input(): HTMLInputElement | undefined {
        const input = this.querySelector('[slot=input]') as HTMLInputElement | null;
        const defaultInput = this.shadowRoot?.querySelector('input');

        if (input) {
            return input;
        } else if (defaultInput) {
            return defaultInput;
        }

        return undefined;
    }

    _focusInput() {
        this.showResults = true;
        setTimeout(() => this.input?.focus());
    }

    firstUpdated() {
        const el = this.querySelector('[slot=input]') as HTMLInputElement;
        el?.addEventListener('keyup', this._launchSearch.bind(this));
    }

    // Define the element's template
    render() {
        return html`
            <link rel="stylesheet" href="${this.fontUrl}">
            <style>
                :host {
                    --mdi-picker-primary: #6200EE;
                    --mdi-picker-color: white;
                    position: relative;
                    display: inline-block;
                }
                button {
                    display: flex;
                    align-items: center;
                    padding: 6px 13px 6px 5px;
                    font-size: 14px;
                    font-family: 'Roboto';
                    line-height: 16px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                    background-color: var(--mdi-picker-primary);
                    color: var(--mdi-picker-color);
                }
                button > span {
                    padding: 4px 0 4px 8px;
                }
                button > i {
                    height: 24px;
                }
                button > .mdi::before {
                    font-size: 24px;
                    line-height: 1;
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
                .popup {
                    width: calc(32px * 7 + 16px);
                    top: 18px;
                    z-index: 1;
                    background-color: white;
                    transform: scale(0);
                    position: absolute;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    transition: transform 75ms cubic-bezier(.17,.84,.44,1);
                }
                .results {
                    max-height: 140px;
                    overflow-y: scroll;
                    padding: 0px 8px 8px;
                    border-bottom-left-radius: 8px;
                    border-bottom-right-radius: 8px; 
                    background-image: linear-gradient(to bottom, #ffffff, rgba(255, 255, 255, 0)), linear-gradient(to top, #ffffff, rgba(255, 255, 255, 0)), linear-gradient(to bottom, #d2d2d2, rgba(255, 255, 255, 0)), linear-gradient(to top, #d2d2d2, rgba(255, 255, 255, 0));
                    background-position: 0 0, 0 100%, 0 0, 0 100%;
                    background-repeat: no-repeat;
                    background-color: white;
                    background-size: 100% 5em, 100% 5em, 100% 1em, 100% 1em;
                    background-attachment: local, local, scroll, scroll;
                }
                slot[name=input] {
                    display: inline-block;
                    margin: 8px;
                }
                slot[name=input] > input {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 16px;
                    margin: 0;
                    border: solid var(--mdi-picker-primary) 2px;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-family: 'Roboto';
                    outline: none;
                    line-height: 1rem;
                }
                [visible] {
                    visibility: visible;
                    transform: scale(1);
                }
            </style>

            <slot name="button"><button @click="${this._focusInput}">
                ${this.selectedIcon !== undefined
                ? html`<i class="mdi mdi-${this.selectedIcon.name}"></i>`
                : ''
            }
                <span>SELECT ICON</span>
            </button></slot>

            <div class="popup" ?visible="${this.showResults}">
                <slot name="input"><input @keyup="${this._launchSearch}" placeholder="Search an icon" /></slot>
                <div class="results">
                    ${this.searchResults.map(i => html`<div class="icon-btn" @click="${() => this._selectIcon(i)}"><span class="mdi mdi-${i.name}"></span></div>`)}
                </div>
            </div>
        `;
    }
}
