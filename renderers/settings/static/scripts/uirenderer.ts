import { DataModel } from "../../../../models/data.interface";
import { ipc } from "./ipc.js";
import { main } from "./main.js";
import { UIButtonElement, UIElement, UISelectElement, UITextElement } from "./uielement2.js";

/** Avaliable resolutions */
export const resolutions: readonly string[] = Object.freeze(['8K', '4K', '2K', '1080p', '720p']);

interface sections<T> {
    resolution: T | null,
    keepSize: T | null,
    dial: [UISelectElement, UITextElement] | T | null,
    adBlock: T | null,
    sponsorBlock: T | null,
    fullscreen: T | null,
    exit: [UIButtonElement, UIButtonElement] | T | null,
    background: T | null,
    extensions: T | null,
    advanced: T | null
}

export class UIRenderer {

    /**
     * Contenido de cada sección.
     */
    private sections: sections<UIElement> = {
        resolution: null,
        keepSize: null,
        dial: null,
        adBlock: null,
        sponsorBlock: null,
        fullscreen: null,
        exit: null,
        background: null,
        extensions: null,
        advanced: null
    };

    /**
     * Contenedores (div) de las secciones.
     */
    private sectionsContainers: sections<HTMLElement> = {
        resolution: null,
        keepSize: null,
        dial: null,
        adBlock: null,
        sponsorBlock: null,
        fullscreen: null,
        exit: null,
        background: null,
        extensions: null,
        advanced: null
    }

    /**
     * Botones del sidebar.
     */
    private sectionsButtons: sections<HTMLElement> = {
        resolution: null,
        keepSize: null,
        dial: null,
        adBlock: null,
        sponsorBlock: null,
        fullscreen: null,
        exit: null,
        background: null,
        extensions: null,
        advanced: null
    }

    private focusedSectionName: keyof sections<any>;
    private focusedUIElement: UIElement | null;

    private hiddenSectionsVisible: boolean = false;
    private hiddenSections = ['background', 'extensions', 'advanced']

    constructor(private settings: DataModel) {

        (document.querySelector('.titlebar')?.children[0] as HTMLHeadElement).textContent = main.i18n.sections.windowName.name;

        this.renderResolutionSection();
        this.renderKeepSizeSection();
        this.renderDialSection();
        this.renderToggleSection('adBlock', 'adBlock', 'adblock', this.settings.adBlock);
        this.renderToggleSection('sponsorBlock', 'sponsorBlock', 'sponsorblock', this.settings.sponsorBlock);
        this.renderToggleSection('fullscreen', 'fullscreen', 'fullscreen', this.settings.startFullscreen);
        this.renderExitSection();
        this.renderBackgroundSection();

        this.focusedSectionName = 'resolution'
        this.append();
    }

    private renderResolutionSection() {

        const { resolution } = this.settings;
        
        // sections: main.i18n.renderer.settings,
        // utils: main.i18n.utils

        const { title, sidebar_title, explanation_1 } = main.i18n.sections.resolution;
        (document.querySelector('#resolution')?.children[1]! as HTMLSpanElement).textContent = sidebar_title;
        (document.querySelector('#resolution-section')?.children[0]!.children[1] as HTMLHeadElement).textContent = title;
        (document.querySelector('#resolution-section')?.children[1]!.children[0]! as HTMLParagraphElement).textContent = explanation_1;

        this.sections.resolution = new UISelectElement();
        (this.sections.resolution as UISelectElement).init(resolution, resolutions as string[]);
        this.sections.resolution.onChange = this.onSave.bind(this);

    }

    private renderKeepSizeSection() {

        const { enabled } = this.settings.keepSize;

        const { title, sidebar_title, explanation_1 } = main.i18n.sections.keepSize;
        (document.querySelector('#keepSize')?.children[1]! as HTMLSpanElement).textContent = sidebar_title;
        (document.querySelector('#keepsize-section')?.children[0]!.children[1]! as HTMLHeadElement).textContent = title;
        (document.querySelector('#keepsize-section')?.children[1]!.children[0]! as HTMLParagraphElement).textContent = explanation_1;

        this.sections.keepSize = new UISelectElement();
        (this.sections.keepSize as UISelectElement).init(enabled, [true, false])
        this.sections.keepSize.onChange = this.onSave.bind(this);

    }

    private renderDialSection() {

        const { enabled, name } = this.settings.DIAL;

        const { title, sidebar_title, explanation_1, explanation_2 } = main.i18n.sections.dial;
        (document.querySelector('#dial')?.children[1]! as HTMLSpanElement).textContent = sidebar_title;
        (document.querySelector('#dial-section')?.children[0]!.children[1] as HTMLHeadElement).textContent = title;
        (document.querySelector('#dial-section')?.children[1]!.children[0]! as HTMLParagraphElement).textContent = explanation_1;

        this.sections.dial = [new UISelectElement(), new UITextElement()];

        this.sections.dial[0].init(enabled, [true, false]);
        this.sections.dial[1].init(name, explanation_2);
        this.sections.dial[0].onChange = this.onSave.bind(this);
        this.sections.dial[1].onChange = this.onSave.bind(this);
        
    }

    /** Sección con un único selector Activado/Desactivado. */
    private renderToggleSection(name: 'adBlock' | 'sponsorBlock' | 'fullscreen', sidebarId: string, sectionId: string, value: boolean) {

        const { title, sidebar_title, explanation_1 } = main.i18n.sections[name];
        (document.querySelector(`#${sidebarId}`)?.children[1]! as HTMLSpanElement).textContent = sidebar_title;
        (document.querySelector(`#${sectionId}-section`)?.children[0]!.children[1]! as HTMLHeadElement).textContent = title;
        (document.querySelector(`#${sectionId}-section`)?.children[1]!.children[0]! as HTMLParagraphElement).textContent = explanation_1;

        const el = new UISelectElement();
        el.init(!!value, [true, false]);
        el.onChange = this.onSave.bind(this);
        this.sections[name] = el;

    }

    /** Sección con los botones "Cerrar ajustes" y "Salir de la aplicación". */
    private renderExitSection() {

        const { title, sidebar_title, explanation_1, close_settings, quit_app } = main.i18n.sections.exit;
        (document.querySelector('#exit')?.children[1]! as HTMLSpanElement).textContent = sidebar_title;
        (document.querySelector('#exit-section')?.children[0]!.children[1]! as HTMLHeadElement).textContent = title;
        (document.querySelector('#exit-section')?.children[1]!.children[0]! as HTMLParagraphElement).textContent = explanation_1;

        const closeBtn = new UIButtonElement();
        closeBtn.init(close_settings, () => ipc.closeSettings());
        const quitBtn = new UIButtonElement();
        quitBtn.init(quit_app, () => ipc.quitApp());

        this.sections.exit = [closeBtn, quitBtn];

    }

    private renderBackgroundSection() {

        const { background } = this.settings;

        const { title, sidebar_title, explanation_1 } = main.i18n.sections.background;
        (document.querySelector('#background')?.children[1]! as HTMLSpanElement).innerText = sidebar_title;
        (document.querySelector('#background-section')?.children[0]!.children[1] as HTMLHeadElement).textContent = title;
        (document.querySelector('#background-section')?.children[1]!.children[0]! as HTMLParagraphElement).textContent = explanation_1;
        
        this.sections.background = new UISelectElement();
        (this.sections.background as UISelectElement).init(background, [true, false]);
        this.sections.background.onChange = this.onSave.bind(this);
        
    }

    private append() {

        const resolutionSection = document.querySelector('#resolution-section') as HTMLElement;
        const keepSizeSection = document.querySelector('#keepsize-section') as HTMLElement;
        const dialSection = document.querySelector('#dial-section') as HTMLElement;
        const adBlockSection = document.querySelector('#adblock-section') as HTMLElement;
        const sponsorBlockSection = document.querySelector('#sponsorblock-section') as HTMLElement;
        const fullscreenSection = document.querySelector('#fullscreen-section') as HTMLElement;
        const exitSection = document.querySelector('#exit-section') as HTMLElement;
        const backgroundSection = document.querySelector('#background-section') as HTMLElement;
        
        resolutionSection.appendChild(this.sections.resolution as UIElement);
        keepSizeSection.appendChild(this.sections.keepSize as UIElement);
        dialSection.appendChild(((this.sections.dial as UIElement[])[0] as UIElement));
        dialSection.appendChild(((this.sections.dial as UIElement[])[1] as UIElement));
        adBlockSection.appendChild(this.sections.adBlock as UIElement);
        sponsorBlockSection.appendChild(this.sections.sponsorBlock as UIElement);
        fullscreenSection.appendChild(this.sections.fullscreen as UIElement);
        (this.sections.exit as UIElement[]).forEach(b => exitSection.appendChild(b));
        backgroundSection.appendChild(this.sections.background as UIElement);

        this.sectionsContainers = {
            resolution: resolutionSection,
            keepSize: keepSizeSection,
            dial: dialSection,
            adBlock: adBlockSection,
            sponsorBlock: sponsorBlockSection,
            fullscreen: fullscreenSection,
            exit: exitSection,
            background: backgroundSection,
            extensions: null,
            advanced: null
        }

        this.sectionsButtons = {
            resolution: document.querySelector('#resolution') as HTMLElement,
            keepSize: document.querySelector('#keepSize') as HTMLElement,
            dial: document.querySelector('#dial') as HTMLElement,
            adBlock: document.querySelector('#adBlock') as HTMLElement,
            sponsorBlock: document.querySelector('#sponsorBlock') as HTMLElement,
            fullscreen: document.querySelector('#fullscreen') as HTMLElement,
            exit: document.querySelector('#exit') as HTMLElement,
            background: document.querySelector('#background') as HTMLElement,
            extensions: null,
            advanced: null
        }

        this.focusSection('resolution');

    }

    public focusSection(section: keyof sections<any>) {

        if(!this.hiddenSectionsVisible && this.hiddenSections.includes(section)) return;

        this.blurAllSections();
        (this.sectionsContainers[section] as HTMLElement).classList.add('visible');
        (this.sectionsButtons[section] as HTMLElement).classList.add('select');
        this.focusedSectionName = section;
        
        if(this.focusedUIElement) {
            this.focusedUIElement.blur();
            this.focusedUIElement = null;
        }

    }

    public focusElement(el: UIElement, last: boolean = false) {

        this.focusedUIElement?.blur();
        this.focusedUIElement = el;

        if(last) el.focusLast()
        else el.focus();

    }

    public blurAllSections() {
        Object.values(this.sectionsContainers).forEach((v) => {
            if(v instanceof HTMLElement) v.classList.remove('visible');
        });
    
        Object.values(this.sectionsButtons).forEach(v => {
            if(v instanceof HTMLElement) v.classList.remove('select');
        });    
    
        Object.values(this.sections).forEach(v => {
            if(v instanceof Array) v.forEach((e: UIElement) => e.blur());
            else if(v instanceof UIElement) v.blur();
        });

    }

    public up() {

        // Si no hay elemento seleccionado. Estamos en la sidebar.
        if(this.focusedUIElement == null) {

            const sects = (Object.keys(this.sectionsButtons) as Array<keyof sections<any>>);

            for(let i = 0; i < sects.length; i++) {
                if(sects[i] == this.focusedSectionName) {
                    const prev = sects[i - 1];
                    if(!prev) break;
                    this.focusSection(prev);
                    break;
                }
            }
            
        } else {

            const currentSection = this.sections[this.focusedSectionName];
            
            if(!this.focusedUIElement.focusPrevious() && currentSection instanceof Array) {
                
                const currentFocusIndex = currentSection.indexOf(this.focusedUIElement as any);
                if(currentFocusIndex != 0)
                    this.focusElement(currentSection[currentFocusIndex - 1] as UIElement, true);
                else return;
                
            }
        }
        
    }

    public down() {

        if(this.focusedUIElement == null) {

            const sects = (Object.keys(this.sectionsButtons) as Array<keyof sections<any>>);

            for(let i = 0; i < sects.length; i++) {
                if(sects[i] == this.focusedSectionName) {
                    const next = sects[i + 1];
                    if(!next) break;
                    this.focusSection(next);
                    break;
                }
            }
        } else {

            const currentSection = this.sections[this.focusedSectionName];

            // Es posible haber llegado al final.
            if(!this.focusedUIElement.focusNext() && currentSection instanceof Array) {
                
                const currentFocusIndex = currentSection.indexOf(this.focusedUIElement as any);
                if(currentFocusIndex < currentSection.length - 1)
                    this.focusElement(currentSection[currentFocusIndex + 1] as UIElement);
                else return;
                
            }
        }

    }

    public right() {

        if(!this.focusedUIElement) {
            const el = this.sections[this.focusedSectionName];
            if(!el) return;
            if(el instanceof Array) this.focusElement(el[0]);
            else this.focusElement(el);
        } else return;

    }

    public left() {

        if(!this.focusedUIElement) return;

        if(this.focusedUIElement instanceof UITextElement) return;

        // Tiene el mismo efecto que desenfocar el elemento directamente
        this.focusSection(this.focusedSectionName);

    }

    public simulateClick() {

        if(this.focusedUIElement instanceof UISelectElement) this.focusedUIElement.select()
        else if(this.focusedUIElement instanceof UIButtonElement) this.focusedUIElement.activate();

    }

    private onSave() {

        let { resolution, keepSize, DIAL, background, userAgent, adBlock, sponsorBlock, startFullscreen } = ipc.settings;

        resolution = (this.sections.resolution as UISelectElement).value as any;
        keepSize.enabled = (this.sections.keepSize as UISelectElement).value as any;
        DIAL.enabled = ((this.sections.dial as UIElement[])[0] as UISelectElement).value as boolean;
        DIAL.name = ((this.sections.dial as UIElement[])[1] as UITextElement).value;
        background = (this.sections.background as UISelectElement).value as boolean;
        adBlock = (this.sections.adBlock as UISelectElement).value as boolean;
        sponsorBlock = (this.sections.sponsorBlock as UISelectElement).value as boolean;
        startFullscreen = (this.sections.fullscreen as UISelectElement).value as boolean;
        
        const settings: DataModel = { resolution, keepSize, DIAL, background, userAgent, adBlock, sponsorBlock, startFullscreen };
        ipc.settings = settings;

    }

}