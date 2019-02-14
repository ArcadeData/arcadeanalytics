export class SettingsNodeClass {

    public fieldLabel: string;
    public fieldWeight: string;
    public sizePolicy: string; // values = fixed | weight
    public labelFontFamily: string;
    public labelFontSize: string;
    public labelColor: string;
    public labelVPosition: string;
    public labelHPosition: string;
    public shapeWidth: string;
    public shapeHeight: string;
    public shapeColor: string;
    public borderWidth: number;
    public borderColor: string;
    public minZoomedFontSize: number;

    constructor() {
        this.fieldLabel = 'id';
        this.fieldWeight = '';
        this.sizePolicy = 'fixed';
        this.labelFontSize = '9px';
        this.labelColor = '#000000';
        this.labelVPosition = 'top';
        this.labelHPosition = 'center';
        this.shapeWidth = '30';
        this.shapeHeight = '30';
        this.shapeColor = '#d174c8';
        this.borderWidth = 1;
        this.borderColor = '#a0a0a0';
        this.minZoomedFontSize = 10;
    }
}
